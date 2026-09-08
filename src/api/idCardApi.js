import axios from "axios";


const PYTHON_API_URL =
    import.meta.env.VITE_PYTHON_API_URL
    || "http://localhost:8001";


const pythonApi = axios.create({
    baseURL: PYTHON_API_URL,
    timeout: 120000,
});


// ============================================================
// HEALTH
// ============================================================

export const checkPythonApi = async () => {

    const response =
        await pythonApi.get(
            "/api/health"
        );

    return response.data;
};


// ============================================================
// ANALYZE TEMPLATE
// ============================================================

export const analyzeDesign = async (
    designFile
) => {

    const formData =
        new FormData();


    formData.append(
        "design",
        designFile
    );


    const response =
        await pythonApi.post(
            "/api/design/analyze",
            formData
        );


    return response.data;
};


// ============================================================
// REMOVE PHOTO BACKGROUND
// ============================================================

export const removePhotoBackground = async (
    photoFile
) => {

    const formData =
        new FormData();


    formData.append(
        "photo",
        photoFile
    );


    const response =
        await pythonApi.post(
            "/api/process/photo/remove-background",
            formData,
            {
                responseType: "blob",
                timeout: 120000
            }
        );


    return response;
};