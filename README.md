# Como buildar o container
É preciso docker.

Antes de tudo, você precisa de uma chave do GEMINI, que pode ser obtida em [aqui](https://aistudio.google.com/projects).

Crie o arquivo `back/.env` com a sua chave, se baseando no arquivo `back/.env-example`.

Depois, basta rodar:

```
docker compose up -d --build
```
