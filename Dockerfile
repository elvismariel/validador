# Estágio de build (Node.js)
FROM node:20-alpine AS build

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante dos arquivos do projeto
COPY . .

# Realiza o build da aplicação (vai gerar os arquivos estáticos na pasta dist)
RUN npm run build

# Estágio final/produção (Nginx)
FROM nginx:alpine

# Copia os arquivos gerados no estágio anterior para o diretório pardrão do nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia as configurações customizadas do Nginx com o healthcheck
COPY nginx.conf /etc/nginx/conf.d/default.conf

# A porta 80 é exposta pelo container (configuração padrão do nginx)
EXPOSE 80

# Comando para rodar o Nginx no foreground garantindo que o container continue rodando
CMD ["nginx", "-g", "daemon off;"]
