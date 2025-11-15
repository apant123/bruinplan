from django.urls import path
from api.views.courses import list_courses

urlpatterns = [
    path("", list_courses),
    path("<int:subject_area_id>/", list_courses),
]