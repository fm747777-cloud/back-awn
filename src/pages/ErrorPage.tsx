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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
            <h1 className="text-4xl font-extrabold text-[#126b71] mb-2">AWN</h1>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 max-w-md mb-6">{errorMessage}</p>
            <Link
                to="/"
                className="px-4 py-2 rounded-xl bg-[#126b71] text-white text-xs font-semibold hover:bg-[#0f555a] transition"
            >
                Return to Dashboard
            </Link>
        </div>
    );
};
