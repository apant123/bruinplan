from django.urls import path
from api.views.units import total_units, ge_units, upper_units, major_units

urlpatterns = [
    path("", total_units),
    path("total_units/", total_units),
    path("ge_units/", ge_units),
    path("upper_units/", upper_units),
    path("major_units/", major_units),
    

]