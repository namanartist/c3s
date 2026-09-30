# Build Stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S c3sgroup && adduser -S c3suser -G c3sgroup
USER c3suser

COPY --from=builder /app/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV APP_TIMEZONE=Asia/Kolkata

EXPOSE 8080

ENTRYPOINT ["java", "-Duser.timezone=Asia/Kolkata", "-jar", "app.jar"]
