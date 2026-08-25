Titulo: Autenticación passwordless con Passkey en el login del ecosistema LifeMiles

Descripción: Actualmente el inicio de sesión de LifeMiles presenta dos opciones de autenticación: ingreso con usuario y contraseña, e inicio de sesión federado a través de redes sociales (Google y Apple). Si bien estas alternativas cubren la mayoría de los casos de uso, ambas dependen de un factor de conocimiento (la contraseña) o de la disponibilidad de un proveedor externo, lo que genera fricción en el login (contraseñas olvidadas, reseteos, fatiga de autenticación) y mantiene expuesta una superficie de ataque asociada al uso de contraseñas, como phishing, credential stuffing y reutilización de contraseñas entre sitios.

Propuesta: Incorporar Passkey (autenticación passwordless basada en el estándar FIDO2/WebAuthn) como una tercera opción dentro del mismo flujo de login, aprovechando el soporte nativo que Keycloak ya ofrece para este mecanismo. La solución contemplaría:
1.	Selección del método de autenticación: el usuario podrá elegir Passkey junto a las opciones actuales de credenciales y redes sociales, sin cambios en la experiencia de los métodos existentes
2.	Registro de Passkey: flujo de enrolamiento donde el usuario asocia una passkey a su cuenta usando el mecanismo de verificación de su propio dispositivo (biometría, PIN o llave de seguridad)
3.	Autenticación sin contraseña: en logins posteriores, el usuario podrá autenticarse solo con la verificación local de su dispositivo, sin necesidad de ingresar usuario ni contraseña
4.	Convivencia con los métodos actuales: Passkey se integra como una alternativa adicional dentro del flujo de autenticación de Keycloak, sin reemplazar ni afectar los métodos de credenciales o redes sociales ya disponibles
5.	Seguridad reforzada: al basarse en criptografía de llave pública y verificación local del dispositivo, Passkey reduce el riesgo de phishing y de robo de credenciales frente al login tradicional.

Propuesta: Incorporar Passkey (autenticación passwordless basada en el estándar FIDO2/WebAuthn) como una tercera opción dentro del mismo flujo de login, aprovechando el soporte nativo que Keycloak ya ofrece para este mecanismo. La solución contemplaría:
1.	Selección del método de autenticación: el usuario podrá elegir Passkey junto a las opciones actuales de credenciales y redes sociales, sin cambios en la experiencia de los métodos existentes
2.	Registro de Passkey: flujo de enrolamiento donde el usuario asocia una passkey a su cuenta usando el mecanismo de verificación de su propio dispositivo (biometría, PIN o llave de seguridad)
3.	Autenticación sin contraseña: en logins posteriores, el usuario podrá autenticarse solo con la verificación local de su dispositivo, sin necesidad de ingresar usuario ni contraseña
4.	Convivencia con los métodos actuales: Passkey se integra como una alternativa adicional dentro del flujo de autenticación de Keycloak, sin reemplazar ni afectar los métodos de credenciales o redes sociales ya disponibles
5.	Seguridad reforzada: al basarse en criptografía de llave pública y verificación local del dispositivo, Passkey reduce el riesgo de phishing y de robo de credenciales frente al login tradicional.
