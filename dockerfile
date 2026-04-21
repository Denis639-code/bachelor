# Use an official Python runtime as a parent image
FROM python:slim
WORKDIR /app

# copy requirements and install them
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# copy application
COPY . /app


# Flask config
ENV FLASK_APP=app.py
ENV FLASK_ENV=development

# expose Flask’s port
EXPOSE 5000

# run Flask App
CMD ["python", "app.py"]
