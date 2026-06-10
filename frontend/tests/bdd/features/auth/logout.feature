# language: es
Característica: Cierre de sesión de usuarios
  Como usuario autenticado
  Quiero cerrar mi sesión
  Para salir de la plataforma de forma segura

  Antecedentes:
    Dado que Stephano ha iniciado sesión correctamente

  Escenario: Logout exitoso desde el menú de usuario
    Cuando Stephano cierra su sesión
    Entonces Stephano debería ser redirigido a la página de login
    Y Stephano debería ver el formulario de acceso
