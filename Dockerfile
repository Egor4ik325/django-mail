FROM python:3.9-alpine

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DEBUG 0

# Install psycopg2 (depencencies + package)
RUN apk update \
    && apk add --virtual build-deps gcc python3-dev musl-dev postgresql-dev \
    && pip install psycopg2 \
    && apk del build-deps

COPY ./requirements.txt .
RUN pip install -r requirements.txt


# Copy all files to workdir
COPY . .

RUN adduser -D myuser
RUN chown myuser /app
USER myuser

RUN python manage.py collectstatic --noinput

# Make migrations if necessary
RUN python manage.py migrate

CMD gunicorn project3.wsgi:application --bind 0.0.0.0:$PORT