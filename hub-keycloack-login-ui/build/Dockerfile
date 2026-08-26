# Utilizar la imagen de Node.js
FROM node:20.15.0-buster

# Argumento y variable de entorno para el token
ARG git_token
ENV TOKEN_J $git_token

# Crear directorios para la caché y el release
RUN mkdir -p /tmp/cache/build /workdir/release

# Copiar package.json y el archivo .npmrc
COPY package.json /tmp/cache/build/
COPY .npmrc /tmp/cache/build/

# Instalar las dependencias
RUN cd /tmp/cache/build && yarn install

# Copiar el resto del proyecto
COPY . /workdir/

# Establecer el directorio de trabajo
WORKDIR /workdir

# Crear el archivo de cobertura (opcional)
RUN mkdir coverage && cd coverage && touch lcov.info

# Exponer el puerto 80
EXPOSE 80

# Construir la aplicación
RUN cp -a /tmp/cache/build/node_modules node_modules && \
    rm -rf dist && \
    yarn build && \
    cp -a deploy/. dist/release/ && \
    chown -R 1002:1002 release