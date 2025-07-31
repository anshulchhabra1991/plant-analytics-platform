"""
Infrastructure Layer: RabbitMQ Client Adapter
Handles message queue operations using centralized config
"""
import os
import pika
import json
from datetime import datetime
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class RabbitMQConfig:
    """Configuration for RabbitMQ connection using centralized config"""
    def __init__(self):
        # Import config here to avoid circular imports
        try:
            from plant_analytics.config import config
            self.host = config.rabbitmq.host
            self.port = config.rabbitmq.port
            self.username = config.rabbitmq.username
            self.password = config.rabbitmq.password
            self.vhost = config.rabbitmq.vhost
        except ImportError:
            # Fallback to environment variables if config not available
            self.host = os.environ.get('RABBITMQ_HOST', 'rabbitmq')
            self.port = int(os.environ.get('RABBITMQ_PORT', '5672'))
            self.username = os.environ.get('RABBITMQ_USER', 'egriduser')
            self.password = os.environ.get('RABBITMQ_PASSWORD', 'egridpass123')
            self.vhost = os.environ.get('RABBITMQ_VHOST', '/')


class RabbitMQClient:
    """Infrastructure adapter for RabbitMQ operations"""
    
    def __init__(self, config: RabbitMQConfig):
        self.config = config
    
    def _get_connection(self):
        """Create RabbitMQ connection"""
        credentials = pika.PlainCredentials(
            self.config.username, 
            self.config.password
        )
        parameters = pika.ConnectionParameters(
            host=self.config.host,
            port=self.config.port,
            virtual_host=self.config.vhost,
            credentials=credentials
        )
        return pika.BlockingConnection(parameters)
    
    def queue_data_for_insertion(self, records: List[Dict[str, Any]]) -> None:
        """Queue processed records for database insertion"""
        if not records:
            return
        
        try:
            connection = self._get_connection()
            channel = connection.channel()
            
            # Declare queue with durability
            channel.queue_declare(queue='database_write_queue', durable=True)
            
            # Queue records in batches for better performance
            batch_size = 100
            for i in range(0, len(records), batch_size):
                batch = records[i:i+batch_size]
                
                message = {
                    'operation': 'bulk_insert',
                    'table': 'egrid_data',
                    'records': batch,
                    'timestamp': datetime.now().isoformat()
                }
                
                channel.basic_publish(
                    exchange='',
                    routing_key='database_write_queue',
                    body=json.dumps(message),
                    properties=pika.BasicProperties(delivery_mode=2)  # Persistent
                )
            
            connection.close()
            logger.info(f"📤 Queued {len(records)} records for database insertion")
            
        except Exception as e:
            logger.error(f"❌ Error queuing data: {e}")
            raise
    
    def send_notification(self, notification_type: str, data: Dict[str, Any]) -> None:
        """Send notification message"""
        try:
            connection = self._get_connection()
            channel = connection.channel()
            
            channel.queue_declare(queue='notification_queue', durable=True)
            
            message = {
                'type': notification_type,
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'source': 'data_processing_pipeline'
            }
            
            channel.basic_publish(
                exchange='',
                routing_key='notification_queue',
                body=json.dumps(message),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            
            connection.close()
            logger.info(f"📧 Sent notification: {notification_type}")
            
        except Exception as e:
            logger.error(f"❌ Error sending notification: {e}")
    
    def send_error_notification(self, error_type: str, error_message: str, context: Dict[str, Any] = None) -> None:
        """Send error notification with context"""
        self.send_notification('error', {
            'error_type': error_type,
            'error_message': error_message,
            'context': context or {}
        })
    
    def send_completion_notification(self, report: Dict[str, Any]) -> None:
        """Send pipeline completion notification"""
        self.send_notification('pipeline_completion', {
            'report': report,
            'status': 'completed'
        }) 