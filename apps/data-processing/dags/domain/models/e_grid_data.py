"""
Domain Model: EGrid Data Entity
Following Clean Architecture principles - Core business entity
"""
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class EGridDataRecord:
    """Core domain entity representing an eGrid data record"""
    generator_id: str
    year: int
    state: str
    plant_name: str
    net_generation: float
    
    def __post_init__(self):
        """Domain validation rules"""
        self.validate()
    
    def validate(self) -> None:
        """Business validation rules for eGrid data"""
        if not self.generator_id or self.generator_id.strip() == '':
            raise ValueError("Generator ID cannot be empty")
        
        if self.year < 1900 or self.year > datetime.now().year + 1:
            raise ValueError(f"Invalid year: {self.year}")
        
        if not self.state or len(self.state.strip()) != 2:
            raise ValueError("State must be a valid 2-character abbreviation")
        
        if not self.plant_name or self.plant_name.strip() == '':
            raise ValueError("Plant name cannot be empty")
        
        if self.net_generation < 0:
            raise ValueError("Net generation cannot be negative")
        
        # Normalize state to uppercase
        self.state = self.state.upper()
        
        # Trim whitespace
        self.generator_id = self.generator_id.strip()
        self.plant_name = self.plant_name.strip()


@dataclass
class FileInfo:
    """Domain entity representing a file to be processed"""
    key: str
    size: int
    last_modified: datetime
    bucket: str
    
    def is_valid_size(self) -> bool:
        """Business rule: File must have content"""
        return self.size > 0
    
    def is_csv_file(self) -> bool:
        """Business rule: File must be CSV"""
        return self.key.lower().endswith('.csv')


@dataclass
class ProcessingBatch:
    """Domain entity representing a batch of files for processing"""
    batch_id: str
    files: list[FileInfo]
    estimated_records: int
    
    def total_size(self) -> int:
        """Calculate total size of all files in batch"""
        return sum(file.size for file in self.files)


@dataclass
class ProcessingReport:
    """Domain entity representing the results of a processing run"""
    pipeline_run_id: str
    execution_date: datetime
    files_scanned: int
    files_validated: int
    files_invalid: int
    total_records_processed: int
    status: str
    duration_minutes: float = 0.0
    
    def success_rate(self) -> float:
        """Calculate processing success rate"""
        if self.files_scanned == 0:
            return 0.0
        return (self.files_validated / self.files_scanned) * 100


# Domain constants
class ProcessingConstants:
    """Business constants for data processing"""
    MIN_VALID_YEAR = 1900
    MAX_NET_GENERATION = 1e15  # 1 petawatt-hour cap
    CHUNK_SIZE = 1000
    BATCH_SIZE = 100
    VALIDATION_SAMPLE_SIZE = 1024  # First 1KB for validation 