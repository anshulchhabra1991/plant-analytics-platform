"""
Infrastructure Layer: Database Client Adapter
Handles database interactions using centralized config
"""
import os
from sqlalchemy import create_engine, func, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DatabaseConfig:
    """Configuration for database connection using centralized config"""
    def __init__(self):
        # Use environment variables directly
        self.host = os.environ.get('POSTGRES_HOST', 'postgres')
        self.port = int(os.environ.get('POSTGRES_PORT', 5432))
        self.database = os.environ.get('POSTGRES_DB', 'plant_analytics')
        self.username = os.environ.get('POSTGRES_USER', 'plantuser')
        self.password = os.environ.get('POSTGRES_PASSWORD', 'plantpassword123')
    
    def get_connection_string(self) -> str:
        """Get database connection string"""
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"


class DatabaseClient:
    """Infrastructure adapter for database operations"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.engine = create_engine(config.get_connection_string())
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
    
    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
    
    def bulk_insert_records(self, records: List[Dict[str, Any]], table_name: str = 'egrid_data') -> int:
        """Bulk insert records into the database"""
        if not records:
            return 0
            
        session = self.get_session()
        try:
            # Build bulk insert SQL
            columns = list(records[0].keys())
            placeholders = ', '.join([f":{col}" for col in columns])
            column_names = ', '.join(columns)
            
            sql = f"""
                INSERT INTO {table_name} ({column_names})
                VALUES ({placeholders})
            """
            
            # Execute bulk insert
            session.execute(text(sql), records)
            session.commit()
            
            logger.info(f"💾 Successfully inserted {len(records)} records into {table_name}")
            return len(records)
            
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"❌ Error bulk inserting records: {e}")
            raise
        finally:
            session.close()
    
    def get_record_count(self, table_class) -> int:
        """Get total record count for a table"""
        session = self.get_session()
        try:
            count = session.query(func.count(table_class.id)).scalar()
            return count or 0
        except SQLAlchemyError as e:
            logger.error(f"❌ Error getting record count: {e}")
            return 0
        finally:
            session.close()
    
    def check_data_exists(self, table_class, threshold: int = 1000) -> bool:
        """Check if significant data already exists"""
        try:
            count = self.get_record_count(table_class)
            exists = count >= threshold
            
            if exists:
                logger.info(f"✅ Database contains {count} records (>= {threshold})")
            else:
                logger.info(f"📊 Database contains {count} records (< {threshold})")
            
            return exists
            
        except Exception as e:
            logger.error(f"❌ Error checking data existence: {e}")
            return False
    
    def health_check(self) -> bool:
        """Check database connectivity"""
        try:
            session = self.get_session()
            session.execute(text("SELECT 1"))
            session.close()
            return True
        except Exception as e:
            logger.error(f"❌ Database health check failed: {e}")
            return False 