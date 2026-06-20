from pathlib import Path

from config.env import settings


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = settings.DJANGO_SECRET_KEY
DEBUG = settings.DJANGO_DEBUG
ALLOWED_HOSTS = settings.allowed_hosts_list

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "apps.suppliers",
    "apps.catalog",
    "apps.projects",
    "apps.estimates",
    "apps.imports",
    "apps.matching",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": settings.POSTGRES_DB,
        "USER": settings.POSTGRES_USER,
        "PASSWORD": settings.POSTGRES_PASS,
        "HOST": settings.POSTGRES_HOST,
        "PORT": settings.POSTGRES_PORT,
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

CORS_ALLOWED_ORIGINS = settings.cors_allowed_origins_list

CELERY_BROKER_URL = settings.REDIS_URL
CELERY_RESULT_BACKEND = settings.REDIS_URL
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Estimate Matcher API",
    "DESCRIPTION": "API for suppliers, price lists, estimates and product matching.",
    "VERSION": "0.1.0",
}

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STATIC_URL = "static/"
