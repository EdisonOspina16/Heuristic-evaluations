# language: es
Característica: Formulario de evaluación
  Como usuario autenticado
  Quiero completar una evaluación heurística
  Para registrar mis observaciones sobre un proyecto

  Antecedentes:
    Dado que el actor "Stephano" está listo para interactuar
    Y Stephano ha iniciado sesión correctamente

  Escenario: Ver el formulario de evaluación
    Cuando Stephano navega a la evaluación 37 del proyecto 1
    Entonces Stephano debería ver el formulario de evaluación
    Y Stephano debería ver la barra de progreso
    Y Stephano debería ver al menos una dimensión

  Escenario: Ver el progreso inicial en cero
    Cuando Stephano navega a la evaluación 37 del proyecto 1
    Entonces Stephano debería ver el contador de progreso
    Y el progreso debería mostrar 0 preguntas respondidas

  Escenario: Responder una pregunta y guardar progreso
    Cuando Stephano navega a la evaluación 37 del proyecto 1
    Y Stephano responde la primera pregunta disponible
    Entonces Stephano debería ver el progreso actualizado