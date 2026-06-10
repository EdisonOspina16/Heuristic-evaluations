# language: es
Característica: Autenticación de usuarios
  Como usuario registrado
  Quiero poder iniciar sesión
  Para acceder a las funcionalidades protegidas

  Antecedentes:
    Dado que el actor "Stephano" está listo para interactuar

  Escenario: Login exitoso con credenciales válidas
    Cuando Stephano intenta iniciar sesión con email "stephano.mejia@outlook.es" y contraseña válida
    Entonces Stephano debería ser redirigido al dashboard
    Y Stephano debería ver el sidebar de navegación

  Escenario: Login fallido con credenciales inválidas
    Cuando Stephano intenta iniciar sesión con email "wrong@email.com" y contraseña "wrongpass"
    Entonces Stephano debería ver un mensaje de error
    Y Stephano debería permanecer en la página de login