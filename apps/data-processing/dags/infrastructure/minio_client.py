"""
Infrastructure Layer: MinIO/S3 Client Adapter
Handles external storage interactions using centralized config
"""
import os
import boto3
from typing import List, Optional
from botocore.exceptions import ClientError
import logging

from domain.models.e_grid_data import FileInfo
from datetime import datetime

logger = logging.getLogger(__name__)


class MinIOConfig:
    """Configuration for MinIO connection using centralized config"""
    def __init__(self):
        # Use environment variables directly
        endpoint_host = os.environ.get('MINIO_ENDPOINT', 'minio:9000')
        # Ensure endpoint has proper protocol for boto3
        if not endpoint_host.startswith(('http://', 'https://')):
            self.endpoint = f'http://{endpoint_host}'
        else:
            self.endpoint = endpoint_host
        self.access_key = os.environ.get('MINIO_ROOT_USER', 'minioadmin')
        self.secret_key = os.environ.get('MINIO_ROOT_PASSWORD', 'minioadmin123')
        self.bucket = os.environ.get('MINIO_BUCKET', 'egrid-data')
        self.secure = False  # Use HTTP for internal communication


class MinIOClient:
    """Infrastructure adapter for MinIO/S3 operations"""
    
    def __init__(self, config: MinIOConfig):
        self.config = config
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of S3 client"""
        if self._client is None:
            self._client = boto3.client(
                's3',
                endpoint_url=self.config.endpoint,
                aws_access_key_id=self.config.access_key,
                aws_secret_access_key=self.config.secret_key,
                verify=False
            )
        return self._client
    
    def list_csv_files(self) -> List[FileInfo]:
        """List all CSV files in the configured bucket"""
        logger.info(f"🔍 Scanning bucket '{self.config.bucket}' for CSV files...")
        
        try:
            response = self.client.list_objects_v2(Bucket=self.config.bucket)
            csv_files = []
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    if obj['Key'].lower().endswith('.csv'):
                        file_info = FileInfo(
                            key=obj['Key'],
                            size=obj['Size'],
                            last_modified=obj['LastModified'],
                            bucket=self.config.bucket
                        )
                        csv_files.append(file_info)
                        logger.info(f"📄 Found: {obj['Key']} ({obj['Size']} bytes)")
            
            logger.info(f"✅ Found {len(csv_files)} CSV files")
            return csv_files
            
        except ClientError as e:
            logger.error(f"❌ Error listing files: {e}")
            raise
    
    def get_file_sample(self, file_info: FileInfo, sample_size: int = 1024) -> str:
        """Get a sample of file content for validation"""
        try:
            response = self.client.get_object(
                Bucket=file_info.bucket,
                Key=file_info.key,
                Range=f'bytes=0-{sample_size-1}'
            )
            return response['Body'].read().decode('utf-8')
            
        except ClientError as e:
            logger.error(f"❌ Error reading file sample {file_info.key}: {e}")
            raise
    
    def download_file(self, file_info: FileInfo, local_path: str) -> None:
        """Download file to local filesystem"""
        try:
            self.client.download_file(
                file_info.bucket, 
                file_info.key, 
                local_path
            )
            logger.info(f"📥 Downloaded {file_info.key} to {local_path}")
            
        except ClientError as e:
            logger.error(f"❌ Error downloading {file_info.key}: {e}")
            raise
    
    def file_exists(self, key: str) -> bool:
        """Check if file exists in bucket"""
        try:
            self.client.head_object(Bucket=self.config.bucket, Key=key)
            return True
        except ClientError:
            return False 