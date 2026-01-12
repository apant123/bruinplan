from django.urls import path
from api.views.planner import planner

urlpatterns = [
    path("users/<uuid:user_id>/classes/<str:quarter>/", planner),
    path("users/<uuid:user_id>/classes/", planner),  # quarter optional
]