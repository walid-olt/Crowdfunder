import env from "./config/env.js"
import express from "express"
import morgan from "morgan"
import { connectDB } from "./config/db.js"
import { globalErrorHandler } from "./middleware/global.js"
import { NotFoundError } from "./utils/errors.js"
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import projectRoutes from "./routes/project.routes.js"
import portfolioRoutes from "./routes/portfolio.routes.js"
const server = express()
server.use(morgan("dev"))
server.use(express.json())
server.use("/auth", authRoutes)

server.use("/users", userRoutes)

server.use("/projects", projectRoutes)
server.use("/portfolio", portfolioRoutes)




// health check
server.get("/health", (req, res)=>{
    res.status(200).json({
        status: "success",
        message: "Server is healthy",
    })
})

// catch all
server.use((_, __, next)=>{
    next(new NotFoundError("Route not found"))
})

// global error handler
server.use(globalErrorHandler)


server.listen(env.PORT, async ()=>{
    await connectDB()
    console.log(`server is running on port ${process.env.PORT}`)
})