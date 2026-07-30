FROM nginx:1.27-alpine

LABEL org.opencontainers.image.title="challenge-urbetrack-nginx" \
      org.opencontainers.image.description="Nginx reverse proxy para la API de validación MD5"

# Eliminar configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra configuración
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/nginx-health || exit 1
