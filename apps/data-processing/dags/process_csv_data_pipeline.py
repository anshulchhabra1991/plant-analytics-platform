"""
Framework Layer: Airflow DAG
Clean Architecture - Only orchestration and framework concerns
Business logic is delegated to application services
"""
import json
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.models import Variable
import logging

# Import application services (Clean Architecture)
import sys
import os
sys.path.append('/opt/airflow/apps')
sys.path.append('/opt/airflow/apps/data-processing')

from application.csv_processor import CSVProcessorOrchestrator
from infrastructure.minio_client import MinIOClient, MinIOConfig
from infrastructure.rabbitmq_client import RabbitMQClient, RabbitMQConfig
from infrastructure.db_client import DatabaseClient, DatabaseConfig

logger = logging.getLogger(__name__)

# Initialize infrastructure clients (Dependency Injection)
def get_csv_processor() -> CSVProcessorOrchestrator:
    """Factory function to create CSV processor with all dependencies"""
    minio_client = MinIOClient(MinIOConfig())
    rabbitmq_client = RabbitMQClient(RabbitMQConfig())
    db_client = DatabaseClient(DatabaseConfig())
    
    return CSVProcessorOrchestrator(minio_client, rabbitmq_client, db_client)


# Airflow Task Functions (Thin wrappers around application services)
def scan_csv_files_task():
    """Airflow task: Scan for CSV files"""
    logger.info("🔍 Starting file scan task...")
    
    processor = get_csv_processor()
    files = processor.scan_files()
    
    # Convert to serializable format for XCom
    file_data = [
        {
            'key': f.key,
            'size': f.size,
            'last_modified': f.last_modified.isoformat(),
            'bucket': f.bucket
        }
        for f in files
    ]
    
    logger.info(f"✅ Scan complete: {len(files)} files found")
    return file_data


def validate_csv_files_task(**context):
    """Airflow task: Validate CSV files"""
    logger.info("🔍 Starting file validation task...")
    
    # Get files from previous task
    file_data = context['task_instance'].xcom_pull(task_ids='scan_csv_files')
    
    # Convert back to domain objects
    from domain.models.e_grid_data import FileInfo
    files = [
        FileInfo(
            key=f['key'],
            size=f['size'],
            last_modified=datetime.fromisoformat(f['last_modified']),
            bucket=f['bucket']
        )
        for f in file_data
    ]
    
    processor = get_csv_processor()
    valid_files, invalid_files = processor.validate_files(files)
    
    # Store results for next task
    valid_data = [
        {
            'key': f.key,
            'size': f.size,
            'last_modified': f.last_modified.isoformat(),
            'bucket': f.bucket
        }
        for f in valid_files
    ]
    
    invalid_data = [
        {
            'key': f.key,
            'size': f.size,
            'last_modified': f.last_modified.isoformat(),
            'bucket': f.bucket
        }
        for f in invalid_files
    ]
    
    context['task_instance'].xcom_push(key='valid_files', value=valid_data)
    context['task_instance'].xcom_push(key='invalid_files', value=invalid_data)
    
    result = {'valid': len(valid_files), 'invalid': len(invalid_files)}
    logger.info(f"✅ Validation complete: {result}")
    return result


def create_processing_batches_task(**context):
    """Airflow task: Create processing batches"""
    logger.info("🔄 Creating processing batches...")
    
    # Get valid files from previous task
    valid_data = context['task_instance'].xcom_pull(
        task_ids='validate_csv_files', 
        key='valid_files'
    )
    
    # Convert back to domain objects
    from domain.models.e_grid_data import FileInfo
    valid_files = [
        FileInfo(
            key=f['key'],
            size=f['size'],
            last_modified=datetime.fromisoformat(f['last_modified']),
            bucket=f['bucket']
        )
        for f in valid_data
    ]
    
    processor = get_csv_processor()
    batches = processor.create_batches(valid_files)
    
    # Convert batches to serializable format
    batch_data = [
        {
            'batch_id': batch.batch_id,
            'files': [
                {
                    'key': f.key,
                    'size': f.size,
                    'last_modified': f.last_modified.isoformat(),
                    'bucket': f.bucket
                }
                for f in batch.files
            ],
            'estimated_records': batch.estimated_records
        }
        for batch in batches
    ]
    
    logger.info(f"📊 Created {len(batches)} processing batches")
    return batch_data


def process_csv_data_task(**context):
    """Airflow task: Process CSV data"""
    logger.info("🌊 Starting CSV data processing...")
    
    # Get batches from previous task
    batch_data = context['task_instance'].xcom_pull(task_ids='create_processing_batches')
    
    # Convert back to domain objects
    from domain.models.e_grid_data import FileInfo, ProcessingBatch
    
    processor = get_csv_processor()
    total_records_processed = 0
    
    for batch_info in batch_data:
        # Reconstruct batch object
        files = [
            FileInfo(
                key=f['key'],
                size=f['size'],
                last_modified=datetime.fromisoformat(f['last_modified']),
                bucket=f['bucket']
            )
            for f in batch_info['files']
        ]
        
        batch = ProcessingBatch(
            batch_id=batch_info['batch_id'],
            files=files,
            estimated_records=batch_info['estimated_records']
        )
        
        # Process batch
        records_processed = processor.process_file_batch(batch)
        total_records_processed += records_processed
    
    logger.info(f"🎉 Processing complete! Total records: {total_records_processed}")
    return {'total_records': total_records_processed}


def generate_report_task(**context):
    """Airflow task: Generate processing report"""
    logger.info("📊 Generating processing report...")
    
    # Get results from previous tasks
    scan_result = context['task_instance'].xcom_pull(task_ids='scan_csv_files')
    validation_result = context['task_instance'].xcom_pull(task_ids='validate_csv_files')
    processing_result = context['task_instance'].xcom_pull(task_ids='process_csv_data')
    
    # Create report using application service
    from domain.models.e_grid_data import ProcessingReport
    
    report = ProcessingReport(
        pipeline_run_id=context['run_id'],
        execution_date=context['execution_date'],
        files_scanned=len(scan_result) if scan_result else 0,
        files_validated=validation_result.get('valid', 0) if validation_result else 0,
        files_invalid=validation_result.get('invalid', 0) if validation_result else 0,
        total_records_processed=processing_result.get('total_records', 0) if processing_result else 0,
        status='completed'
    )
    
    # Store report for monitoring
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
    
    Variable.set('last_etl_report', json.dumps(report_dict))
    
    logger.info(f"✅ Report generated: {json.dumps(report_dict, indent=2)}")
    return report_dict


# DAG Definition (Framework Layer Only)
default_args = {
    'owner': 'plant-analytics-team',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

# Load configuration from JSON file
config_path = os.path.join(os.path.dirname(__file__), 'config', 'etl_config.json')
with open(config_path, 'r') as f:
    configs = json.load(f)

# Get schedule from config (default to hourly if not found)
schedule_interval = configs[0].get('schedule_interval', '0 */1 * * *') if configs else '0 */1 * * *'

dag = DAG(
    'process_csv_data_pipeline',
    default_args=default_args,
    description='Clean Architecture ETL pipeline for processing plant analytics CSV data',
    schedule_interval=schedule_interval,  # Read from config file
    catchup=False,
    max_active_runs=1,
    tags=['production', 'etl', 'plant-analytics', 'clean-architecture'],
)

# Task Definitions (Thin orchestration layer)
scan_task = PythonOperator(
    task_id='scan_csv_files',
    python_callable=scan_csv_files_task,
    dag=dag,
)

validate_task = PythonOperator(
    task_id='validate_csv_files',
    python_callable=validate_csv_files_task,
    dag=dag,
)

batch_task = PythonOperator(
    task_id='create_processing_batches',
    python_callable=create_processing_batches_task,
    dag=dag,
)

process_task = PythonOperator(
    task_id='process_csv_data',
    python_callable=process_csv_data_task,
    dag=dag,
)

report_task = PythonOperator(
    task_id='generate_report',
    python_callable=generate_report_task,
    dag=dag,
)

# Task Dependencies (Clean workflow)
scan_task >> validate_task >> batch_task >> process_task >> report_task 