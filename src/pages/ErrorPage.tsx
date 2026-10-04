import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export const ErrorPage = () => {
    const error = useRouteError();
    let errorMessage = 'An unexpected error occurred.';

    if (isRouteErrorResponse(error)) {
        errorMessage = error.statusText || error.data?.message || errorMessage;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F8F6F2] text-center">
            <h1 className="text-4xl font-extrabold text-[#2D3F2C] tracking-tight mb-2">AWN</h1>
            <h2 className="text-xl font-bold text-[#0D0D0D] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#6E6862] max-w-md mb-6">{errorMessage}</p>
            <Link
                to="/"
                className="px-5 py-2.5 rounded-lg bg-[#2D3F2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#233222] transition shadow-xs"
            >
                Return to Dashboard
            </Link>
        </div>
    );
};
