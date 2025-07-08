const app = require(".");
const { connectToDB } = require("./config/db")

const Port = process.env.PORT || 5001;

(async () => {
    try {
        await connectToDB();
        app.listen(Port, () => {
            console.log(`Server listening on port ${Port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
})();