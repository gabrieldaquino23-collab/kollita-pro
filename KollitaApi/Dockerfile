FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["KollitaApi/KollitaApi.csproj", "KollitaApi/"]
RUN dotnet restore "KollitaApi/KollitaApi.csproj" --disable-parallel

COPY . .
WORKDIR /src/KollitaApi
RUN dotnet publish -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "KollitaApi.dll"]
