FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api.py .
COPY cron.sh .
RUN chmod +x cron.sh

CMD ["./cron.sh", "--sleep", "1800", "--options", "--generate-companies --generate-leaderboards --generate-stats --generate-registration-stats --upload"]
