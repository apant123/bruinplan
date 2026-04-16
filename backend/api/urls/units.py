from django.urls import path
from api.views.units import get_total_units

urlpatterns = [
    path("", get_total_units),
    path("total_units/", get_total_units),
    

]