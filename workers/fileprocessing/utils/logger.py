import logging
import json
import traceback
from datetime import datetime

class JsonFormatter(logging.Formatter):
    """
    A custom logging formatter that outputs log records as JSON.
    """
    def format(self, record):
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(), # ISO 8601
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
            "threadName": record.threadName,
        }

        # Add extra attributes from record.__dict__ (from 'extra' argument)
        # Exclude standard internal record attributes
        for key, value in record.__dict__.items():
            if not key.startswith('_') and key not in log_record and key not in ['msg', 'args', 'levelname', 'levelno',
                                                                                 'pathname', 'filename', 'module',
                                                                                 'exc_info', 'exc_text', 'stack_info',
                                                                                 'lineno', 'funcName', 'created',
                                                                                 'msecs', 'relativeCreated', 'thread',
                                                                                 'threadName', 'processName', 'process']:
                log_record[key] = value

        # Handle exception information
        if record.exc_info:
            log_record["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info),
            }
        elif record.exc_text:
            log_record["exception"] = {"traceback": record.exc_text}

        # Handle stack info
        if record.stack_info:
            log_record["stack_info"] = record.stack_info

        # Convert to JSON string
        return json.dumps(log_record, default=str, indent=None) # indent=None for single line

def setup_logger(name="common_fileprocessing"):
    """
    Sets up a logger with a console handler and a file handler,
    both configured to output JSON logs.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO) # Set the minimum logging level

    if not logger.handlers:
        console_handler = logging.StreamHandler()
        file_handler = logging.FileHandler("logs.log")
        console_formatter = JsonFormatter()
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        file_formatter = JsonFormatter()
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger