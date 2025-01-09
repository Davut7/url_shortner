URL Shortener Application
Environment Variables
Before running the application, you need to configure the following environment variables in your .env file:

bash
Copy code
PORT=5005
BACKEND_URL=http://localhost:5005
How to Run the Application
To run the application, you can use the following Docker Compose command:

bash
Copy code
docker-compose up --build -d
This will build the application and run it in detached mode.

How to Access the Documentation
The API documentation is available at /docs. You can access it via your browser once the application is running.

Example:
http://localhost:5005/docs

How to Run Tests
To run the tests for this application, execute the following command:

bash
Copy code
npm run test
This will run the test suite and provide feedback on the status of your tests.

Russian Version
Приложение для сокращения URL
Переменные окружения
Перед запуском приложения необходимо настроить следующие переменные окружения в файле .env:

bash
Copy code
PORT=5005
BACKEND_URL=http://localhost:5005
Как запустить приложение
Для запуска приложения используйте следующую команду Docker Compose:

bash
Copy code
docker-compose up --build -d
Эта команда соберет приложение и запустит его в фоновом режиме.

Как получить доступ к документации
Документация API доступна по адресу /docs. Вы можете получить к ней доступ через браузер, когда приложение будет запущено.

Пример:
http://localhost:5005/docs

Как запустить тесты
Для выполнения тестов приложения используйте команду:

bash
Copy code
npm run test
Эта команда выполнит набор тестов и отобразит результаты выполнения.
