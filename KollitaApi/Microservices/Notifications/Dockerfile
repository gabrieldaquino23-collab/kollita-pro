# Dockerfile para Kollita Notifications Microservice
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["KollitaApi/KollitaApi.csproj", "KollitaApi/"]
COPY ["KollitaApi/Microservices/Notifications/NotificationService.csproj", "KollitaApi/Microservices/Notifications/"]
RUN dotnet restore "KollitaApi/Microservices/Notifications/NotificationService.csproj"
COPY . .
RUN dotnet build "KollitaApi/Microservices/Notifications/NotificationService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "KollitaApi/Microservices/Notifications/NotificationService.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=publish /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "NotificationService.dll"]
