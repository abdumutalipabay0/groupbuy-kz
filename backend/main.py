from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models.schemas import ApiResponse
from routers import auth, feed, groups, products, recommend


app = FastAPI(title="GroupBuy API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://*.vercel.app"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(feed.router)
app.include_router(groups.router)
app.include_router(recommend.router)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse[None](success=False, message=str(exc.detail), code=exc.status_code).model_dump(),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=ApiResponse[None](success=False, message=str(exc), code=500).model_dump(),
    )


@app.get("/", response_model=ApiResponse[dict[str, str]])
def healthcheck() -> ApiResponse[dict[str, str]]:
    return ApiResponse(data={"status": "ok"}, success=True, message="GroupBuy API is running")
