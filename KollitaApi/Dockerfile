# ============================================================
# Kollita Pro API — Dockerfile para Render
# Base: .NET 8 LTS | Multi-stage build optimizado
# ============================================================

# Etapa 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar csproj y restaurar dependencias (cache layer)
COPY ["KollitaApi.csproj", "./"]
RUN dotnet restore "KollitaApi.csproj"

# Copiar todo el código y compilar
COPY . .
RUN dotnet build "KollitaApi.csproj" -c Release -o /app/build

# Etapa 2: Publish
FROM build AS publish
RUN dotnet publish "KollitaApi.csproj" -c Release -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# Etapa 3: Runtime (imagen mínima)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Variables de entorno por defecto
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

# Copiar publicación
COPY --from=publish /app/publish .

# Exponer puerto (Render usa PORT dinámico)
EXPOSE 8080

ENTRYPOINT ["dotnet", "KollitaApi.dll"]
