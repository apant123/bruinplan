from django.urls import path
from api.views.courses import course_prereqs

urlpatterns = [
    path("<int:course_id>/requisites/", course_prereqs),

]