FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["KollitaApi/KollitaApi.csproj", "KollitaApi/"]
RUN dotnet restore "KollitaApi/KollitaApi.csproj"

COPY . .
RUN dotnet publish "KollitaApi/KollitaApi.csproj" -c Release -o /app --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "KollitaApi.dll"]
