# language: es
Característica: Dashboard principal
  Como usuario autenticado
  Quiero ver el dashboard
  Para tener una visión general de mis proyectos

  Antecedentes:
    Dado que el actor "Stephano" está listo para interactuar
    Y Stephano ha iniciado sesión correctamente

  Escenario: Ver el dashboard con proyectos
    Cuando Stephano navega al dashboard
    Entonces Stephano debería ver el sidebar de navegación
    Y Stephano debería ver la lista de proyectos recientes
