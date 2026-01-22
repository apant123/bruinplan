from django.urls import path
from api.views.dars import upload_audit

urlpatterns = [
    path('upload/', upload_audit, name='upload_audit'),
]
