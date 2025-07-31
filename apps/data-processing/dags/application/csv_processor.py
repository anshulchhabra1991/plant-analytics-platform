"""
Application Layer: CSV Processing Use Cases
Contains business workflows and processing logic
"""
import os
import pandas as pd
from typing import List, Dict, Any, Tuple
import logging

from domain.models.e_grid_data import (
    EGridDataRecord, 
    FileInfo, 
    ProcessingBatch, 
    ProcessingReport,
    ProcessingConstants
)
from infrastructure.minio_client import MinIOClient
from infrastructure.rabbitmq_client import RabbitMQClient
from infrastructure.db_client import DatabaseClient

logger = logging.getLogger(__name__)


class FileValidationService:
    """Application service for file validation"""
    
    def __init__(self, minio_client: MinIOClient):
        self.minio_client = minio_client
    
    def validate_csv_structure(self, file_info: FileInfo) -> bool:
        """Validate CSV file structure contains required columns"""
        try:
            if not file_info.is_valid_size() or not file_info.is_csv_file():
                return False
            
            # Get sample content
            sample = self.minio_client.get_file_sample(
                file_info, 
                ProcessingConstants.VALIDATION_SAMPLE_SIZE
            )
            
            # Check for required columns
            required_columns = [
                'Plant name',
                'Generator annual net generation (MWh)',
                'Generator ID',
                'Data Year',
                'Plant state abbreviation'
            ]
            
            for column in required_columns:
                if column not in sample:
                    logger.warning(f"⚠️ Missing column '{column}' in {file_info.key}")
                    return False
            
            logger.info(f"✅ Valid CSV structure: {file_info.key}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error validating {file_info.key}: {e}")
            return False
    
    def validate_files(self, files: List[FileInfo]) -> Tuple[List[FileInfo], List[FileInfo]]:
        """Validate multiple files and return valid/invalid lists"""
        valid_files = []
        invalid_files = []
        
        for file_info in files:
            if self.validate_csv_structure(file_info):
                valid_files.append(file_info)
            else:
                invalid_files.append(file_info)
        
        logger.info(f"✅ Validation complete: {len(valid_files)} valid, {len(invalid_files)} invalid")
        return valid_files, invalid_files


class DataTransformationService:
    """Application service for data transformation and cleaning"""
    
    @staticmethod
    def clean_numeric_value(value: Any) -> float:
        """Clean and convert numeric values with business rules"""
        if pd.isna(value) or value == '' or value is None:
            return 0.0
        
        try:
            # Convert to string and clean
            str_value = str(value).strip()
            # Remove quotes, commas, and other non-numeric characters except decimal point
            cleaned = ''.join(c for c in str_value if c.isdigit() or c == '.')
            
            if cleaned == '':
                return 0.0
                
            # Convert to float
            numeric_value = float(cleaned)
            
            # Apply business rule: cap extremely large values
            if numeric_value > ProcessingConstants.MAX_NET_GENERATION:
                logger.warning(f"⚠️ Capping large value: {numeric_value}")
                return ProcessingConstants.MAX_NET_GENERATION
                
            return numeric_value
            
        except (ValueError, TypeError) as e:
            logger.warning(f"⚠️ Could not convert '{value}' to numeric: {e}")
            return 0.0
    
    def process_csv_chunk(self, chunk_df: pd.DataFrame) -> List[EGridDataRecord]:
        """Process a chunk of CSV data and return domain objects"""
        processed_records = []
        
        for _, row in chunk_df.iterrows():
            try:
                # Extract and clean data
                net_gen_raw = str(row.get('Generator annual net generation (MWh)', '0')).strip()
                net_gen_cleaned = net_gen_raw.replace('"', '').replace(',', '')
                
                # Create domain object (validation happens in __post_init__)
                record = EGridDataRecord(
                    generator_id=str(row.get('Generator ID', 'UNKNOWN')).strip(),
                    year=int(row.get('Data Year', 2023)),
                    state=str(row.get('Plant state abbreviation', '')).strip(),
                    plant_name=str(row.get('Plant name', '')).strip(),
                    net_generation=self.clean_numeric_value(net_gen_cleaned)
                )
                
                processed_records.append(record)
                
            except (ValueError, TypeError) as e:
                logger.warning(f"⚠️ Skipping invalid record: {e}")
                continue
        
        return processed_records


class BatchProcessingService:
    """Application service for batch processing operations"""
    
    def create_processing_batches(self, files: List[FileInfo]) -> List[ProcessingBatch]:
        """Create processing batches from validated files"""
        batches = []
        
        for i, file_info in enumerate(files):
            batch = ProcessingBatch(
                batch_id=f"batch_{i}",
                files=[file_info],
                estimated_records=file_info.size // 100  # Rough estimate
            )
            batches.append(batch)
        
        logger.info(f"📊 Created {len(batches)} processing batches")
        return batches


class CSVProcessorOrchestrator:
    """Main application service orchestrating the CSV processing workflow"""
    
    def __init__(
        self, 
        minio_client: MinIOClient,
        rabbitmq_client: RabbitMQClient,
        db_client: DatabaseClient
    ):
        self.minio_client = minio_client
        self.rabbitmq_client = rabbitmq_client
        self.db_client = db_client
        
        # Initialize services
        self.file_validator = FileValidationService(minio_client)
        self.data_transformer = DataTransformationService()
        self.batch_processor = BatchProcessingService()
    
    def scan_files(self) -> List[FileInfo]:
        """Scan for CSV files to process"""
        return self.minio_client.list_csv_files()
    
    def validate_files(self, files: List[FileInfo]) -> Tuple[List[FileInfo], List[FileInfo]]:
        """Validate files for processing"""
        return self.file_validator.validate_files(files)
    
    def create_batches(self, files: List[FileInfo]) -> List[ProcessingBatch]:
        """Create processing batches"""
        return self.batch_processor.create_processing_batches(files)
    
    def process_file_batch(self, batch: ProcessingBatch) -> int:
        """Process a batch of files and return total records processed"""
        total_records = 0
        
        for file_info in batch.files:
            records_in_file = self._process_single_file(file_info)
            total_records += records_in_file
            
        return total_records
    
    def _process_single_file(self, file_info: FileInfo) -> int:
        """Process a single file"""
        logger.info(f"📥 Processing file: {file_info.key}")
        
        # Download file temporarily
        local_path = f"/tmp/{file_info.key.replace('/', '_')}"
        
        try:
            self.minio_client.download_file(file_info, local_path)
            
            total_records = 0
            
            # Read CSV with proper row handling:
            # Use row 1 (header) for validation, skip row 2 (description), process data from row 3+
            logger.info("🔍 Validating CSV structure using header row...")
            validation_df = pd.read_csv(local_path, nrows=0)  # Read only header row for validation
            
            # Validate required columns exist
            required_columns = [
                'Plant name',
                'Generator annual net generation (MWh)',
                'Generator ID',
                'Data Year',
                'Plant state abbreviation'
            ]
            
            missing_columns = [col for col in required_columns if col not in validation_df.columns]
            if missing_columns:
                logger.error(f"❌ Missing required columns in {file_info.key}: {missing_columns}")
                return 0
            
            logger.info("✅ CSV validation passed, processing data from row 3 onwards...")
            
            # Process in chunks: Row 1 = headers, skip row 2 (descriptions), process row 3+
            for chunk_df in pd.read_csv(
                local_path, 
                skiprows=[1],  # Skip only row 2 (index 1), use row 1 as headers
                chunksize=ProcessingConstants.CHUNK_SIZE
            ):
                # Transform data to domain objects
                records = self.data_transformer.process_csv_chunk(chunk_df)
                
                # Convert to dict format for queuing
                record_dicts = [
                    {
                        'gen_id': r.generator_id,
                        'year': r.year,
                        'state': r.state,
                        'plant_name': r.plant_name,
                        'net_generation': r.net_generation
                    }
                    for r in records
                ]
                
                # Insert directly into database
                if record_dicts:
                    inserted_count = self.db_client.bulk_insert_records(record_dicts)
                    total_records += inserted_count
                
                logger.info(f"✅ Processed chunk: {len(record_dicts)} records from {file_info.key}")
            
            logger.info(f"📊 Completed file {file_info.key}: {total_records} records")
            return total_records
            
        except Exception as e:
            logger.error(f"❌ Error processing file {file_info.key}: {e}")
            self.rabbitmq_client.send_error_notification(
                'file_processing_error',
                str(e),
                {'file': file_info.key}
            )
            return 0
            
        finally:
            # Clean up temporary file
            if os.path.exists(local_path):
                os.remove(local_path)
    
    def check_if_processing_needed(self, table_class) -> bool:
        """Check if data processing is needed"""
        return not self.db_client.check_data_exists(table_class, threshold=1000)
    
    def generate_report(self, 
                       pipeline_run_id: str, 
                       execution_date, 
                       scan_result: List[FileInfo],
                       validation_result: Tuple[List[FileInfo], List[FileInfo]],
                       total_records: int) -> ProcessingReport:
        """Generate processing report"""
        valid_files, invalid_files = validation_result
        
        report = ProcessingReport(
            pipeline_run_id=pipeline_run_id,
            execution_date=execution_date,
            files_scanned=len(scan_result),
            files_validated=len(valid_files),
            files_invalid=len(invalid_files),
            total_records_processed=total_records,
            status='completed'
        )
        
        # Send completion notification
        report_dict = {
            'pipeline_run_id': report.pipeline_run_id,
            'execution_date': report.execution_date.isoformat(),
            'files_scanned': report.files_scanned,
            'files_validated': report.files_validated,
            'files_invalid': report.files_invalid,
            'total_records_processed': report.total_records_processed,
            'success_rate': report.success_rate(),
            'status': report.status
        }
        
        self.rabbitmq_client.send_completion_notification(report_dict)
        
        return report 