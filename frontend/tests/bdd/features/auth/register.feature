# language: es
Característica: Registro de usuarios
  Como visitante
  Quiero crear una cuenta
  Para poder acceder a la plataforma

  Antecedentes:
    Dado que el actor "Stephano" está listo para interactuar

  Escenario: Registro exitoso con auto inicio de sesión
    Cuando Stephano se registra con nombre "Stephano BDD" y contraseña válida
    Entonces Stephano debería ser redirigido al dashboard después del registro
    Y Stephano debería ver el sidebar después del registro
