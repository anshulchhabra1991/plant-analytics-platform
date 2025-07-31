FROM apache/airflow:2.8.1-python3.11

USER root

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        vim \
        curl \
    && apt-get autoremove -yqq --purge \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER airflow

# Copy requirements first for better caching
COPY requirements.txt /requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r /requirements.txt

# Copy configuration and DAGs

COPY . /opt/airflow/
COPY dags/ /opt/airflow/dags
COPY plugins/ /opt/airflow/plugins

# Set environment variables
ENV AIRFLOW__CORE__LOAD_EXAMPLES=False
ENV AIRFLOW__WEBSERVER__EXPOSE_CONFIG=True
ENV AIRFLOW__CORE__EXECUTOR=LocalExecutor

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=5 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080
