import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
    FaDownload,
    FaEye,
    FaTrash,
    FaSync,
    FaSchool,
    FaUserGraduate,
    FaCalendarAlt,
    FaIdCard
} from 'react-icons/fa';
import toast from 'react-hot-toast';

/*
|--------------------------------------------------------------------------
| Backend URL
|--------------------------------------------------------------------------
| Axios uses /api for the Node backend.
| Images may come back as:
|
|   /uploads/...
|   uploads/...
|   http://localhost:5000/uploads/...
|   data:image/...
|
| This helper normalizes all of them.
|
| If your Node backend is running on another port, set:
|
| VITE_NODE_API_URL=http://localhost:5000
|
| in frontend .env
|--------------------------------------------------------------------------
*/

const NODE_API_ORIGIN = (
    import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');


function IDCards() {

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const [filter, setFilter] = useState({
        schoolId: '',
        status: '',
        search: '',
        dateFrom: '',
        dateTo: ''
    });

    const [schools, setSchools] = useState([]);

    const [selectedCard, setSelectedCard] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [pagination, setPagination] = useState({
        limit: 20,
        offset: 0,
        total: 0
    });

    const [imageErrors, setImageErrors] = useState({
        front: false,
        back: false
    });

    const [detailsLoading, setDetailsLoading] = useState(false);


    /* ============================================================
       URL HELPERS
       ============================================================ */

    const getImageUrl = useCallback((url) => {

        if (!url) {
            return '';
        }

        if (typeof url !== 'string') {
            return '';
        }

        const value = url.trim();

        if (!value) {
            return '';
        }

        /*
        | Base64 / blob
        */
        if (
            value.startsWith('data:') ||
            value.startsWith('blob:')
        ) {
            return value;
        }

        /*
        | Already absolute URL
        */
        if (
            value.startsWith('http://') ||
            value.startsWith('https://')
        ) {
            return value;
        }

        /*
        | API relative URL
        |
        | Example:
        | /api/...
        */
        if (value.startsWith('/api/')) {
            return `${window.location.origin}${value}`;
        }

        /*
        | Backend upload path
        |
        | Example:
        | /uploads/designs/abc.jpg
        */
        if (value.startsWith('/uploads/')) {
            return `${NODE_API_ORIGIN}${value}`;
        }

        /*
        | uploads/designs/abc.jpg
        */
        if (value.startsWith('uploads/')) {
            return `${NODE_API_ORIGIN}/${value}`;
        }

        /*
        | ./uploads/...
        */
        if (value.startsWith('./uploads/')) {
            return `${NODE_API_ORIGIN}/${value.substring(2)}`;
        }

        /*
        | Windows-like path should never normally be returned
        | by backend. Try to convert it to uploads path.
        */
        if (
            value.includes('\\uploads\\') ||
            value.includes('/uploads/')
        ) {

            const uploadIndex = value.toLowerCase().indexOf('uploads');

            if (uploadIndex >= 0) {

                let uploadPath = value.substring(uploadIndex);

                uploadPath = uploadPath
                    .replace(/\\/g, '/');

                return `${NODE_API_ORIGIN}/${uploadPath}`;
            }
        }

        /*
        | If backend returned another relative path,
        | assume it belongs to backend.
        */
        if (!value.startsWith('/')) {
            return `${NODE_API_ORIGIN}/${value}`;
        }

        /*
        | Generic absolute path.
        */
        return `${NODE_API_ORIGIN}${value}`;

    }, []);


    /* ============================================================
       GENERIC VALUE HELPER
       ============================================================ */

    const firstValue = (...values) => {

        for (const value of values) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ''
            ) {
                return value;
            }
        }

        return '';
    };


    /* ============================================================
       PARSE JSON SAFELY
       ============================================================ */

    const parseObject = (value) => {

        if (!value) {
            return {};
        }

        if (typeof value === 'object') {
            return value;
        }

        if (typeof value === 'string') {

            try {
                const parsed = JSON.parse(value);

                if (parsed && typeof parsed === 'object') {
                    return parsed;
                }

            } catch (error) {
                console.warn('JSON parse failed:', error);
            }
        }

        return {};
    };


    /* ============================================================
       NORMALIZE STUDENT DATA
       ============================================================ */

    const normalizeStudentData = (card) => {

        const root = card || {};

        const studentData = parseObject(
            root.studentData ||
            root.student_data ||
            root.student ||
            root.data
        );

        const nestedStudent = parseObject(
            studentData.studentData ||
            studentData.student_data ||
            studentData.student
        );

        const merged = {
            ...root,
            ...studentData,
            ...nestedStudent
        };

        // If a card has a stored field-value snapshot (id_cards.field_data),
        // overlay its front-side values so the exact values that were rendered
        // on the card are used for display — even if the design fields changed
        // since it was generated. Each snapshot entry is { field_key, value }.
        const cardFieldData = parseObject(root.field_data);
        const frontVals = Array.isArray(cardFieldData?.front) ? cardFieldData.front : [];
        frontVals.forEach((entry) => {
            if (!entry || entry.value == null || entry.value === '') return;
            const k = String(entry.field_key || '').trim();
            if (!k) return;
            merged[k] = entry.value;
            merged[k.toLowerCase()] = entry.value;
        });

        return {

            name: firstValue(
                merged.student_name,
                merged.studentName,
                merged.name,
                merged.full_name,
                merged.fullName
            ),

            father_name: firstValue(
                merged.father_name,
                merged.fatherName,
                merged.father,
                merged.fathername
            ),

            class: firstValue(
                merged.class,
                merged.class_name,
                merged.className,
                merged.grade,
                merged.standard
            ),

            section: firstValue(
                merged.section,
                merged.section_name,
                merged.sectionName,
                merged.division
            ),

            admission_number: firstValue(
                merged.admission_number,
                merged.admissionNumber,
                merged.admission_no,
                merged.admissionNo,
                merged.admission
            ),

            roll_number: firstValue(
                merged.roll_number,
                merged.rollNumber,
                merged.roll_no,
                merged.rollNo
            ),

            phone: firstValue(
                merged.student_phone,
                merged.phone,
                merged.mobile,
                merged.mobileNo,
                merged.mobile_number,
                merged.mobileNumber,
                merged.contact
            ),

            address: firstValue(
                merged.address,
                merged.student_address,
                merged.studentAddress,
                merged.home_address
            ),

            dob: firstValue(
                merged.dob,
                merged.date_of_birth,
                merged.dateOfBirth,
                merged.birth_date,
                merged.birthDate
            )
        };
    };


    /* ============================================================
       NORMALIZE IMAGE DATA
       ============================================================ */

    const getFrontImageFromCard = (card) => {

        if (!card) {
            return '';
        }

        const images = parseObject(card.images);
        const downloadUrls = parseObject(card.downloadUrls);
        const generated = parseObject(card.generated);
        const cardImages = parseObject(card.cardImages);

        const raw = firstValue(

            /*
            | New normalized response
            */
            images.front,

            /*
            | Existing response
            */
            downloadUrls.front,

            /*
            | Generated object
            */
            generated.front,

            /*
            | Card images object
            */
            cardImages.front,

            /*
            | Existing database/API fields
            */
            card.front_image_url,
            card.frontImageUrl,
            card.front_image,
            card.frontImage,

            /*
            | Other possible backend names
            */
            card.generated_front_url,
            card.generatedFrontUrl,
            card.front_url,
            card.frontUrl,

            /*
            | Nested card
            */
            card.card?.front_image_url,
            card.card?.frontImageUrl,
            card.card?.frontImage
        );

        return getImageUrl(raw);
    };


    const getBackImageFromCard = (card) => {

        if (!card) {
            return '';
        }

        const images = parseObject(card.images);
        const downloadUrls = parseObject(card.downloadUrls);
        const generated = parseObject(card.generated);
        const cardImages = parseObject(card.cardImages);

        const raw = firstValue(

            /*
            | Generated back
            */
            images.back,
            downloadUrls.back,
            generated.back,
            cardImages.back,

            /*
            | Existing generated back fields
            */
            card.back_image_url,
            card.backImageUrl,
            card.back_image,
            card.backImage,

            card.generated_back_url,
            card.generatedBackUrl,
            card.back_url,
            card.backUrl,

            /*
            | Nested card
            */
            card.card?.back_image_url,
            card.card?.backImageUrl,
            card.card?.backImage
        );

        return getImageUrl(raw);
    };


    /* ============================================================
       GET DESIGN ID
       ============================================================ */

    const getDesignId = (card) => {

        if (!card) {
            return '';
        }

        return firstValue(
            card.design_id,
            card.designId,
            card.id_design_id,
            card.design?.id
        );
    };


    /* ============================================================
       LOAD DESIGN BACK TEMPLATE
       ============================================================ */

    const loadBackTemplateIfNeeded = async (card) => {

        const existingBack = getBackImageFromCard(card);

        if (existingBack) {
            return card;
        }

        const designId = getDesignId(card);

        if (!designId) {
            return card;
        }

        try {

            const response = await api.get(
                `/owner/designs/${designId}`
            );

            const design = response.data || {};

            const backTemplate = firstValue(
                design.back_template,
                design.backTemplate,
                design.back_image_url,
                design.backImageUrl,
                design.back_image,
                design.backImage
            );

            if (backTemplate) {

                return {
                    ...card,

                    design: {
                        ...(card.design || {}),
                        ...design
                    },

                    images: {
                        ...(card.images || {}),
                        back: getImageUrl(backTemplate)
                    }
                };
            }

        } catch (error) {

            console.warn(
                'Could not load back template:',
                error
            );
        }

        return card;
    };


    /* ============================================================
       NORMALIZE COMPLETE CARD
       ============================================================ */

    const normalizeCard = (card) => {

        const student = normalizeStudentData(card);

        const front = getFrontImageFromCard(card);
        const back = getBackImageFromCard(card);

        return {

            ...card,

            student,

            studentData: student,

            images: {
                ...(card.images || {}),
                front,
                back
            },

            downloadUrls: {
                ...(card.downloadUrls || {}),
                front,
                back
            },

            front_image_url: front,
            back_image_url: back
        };
    };


    /* ============================================================
       INITIAL LOAD
       ============================================================ */

    useEffect(() => {

        fetchSchools();
        fetchStats();
        fetchCards();

    }, []);


    useEffect(() => {

        fetchCards();

    }, [
        filter.schoolId,
        filter.status,
        filter.search,
        filter.dateFrom,
        filter.dateTo,
        pagination.offset
    ]);


    /* ============================================================
       FETCH SCHOOLS
       ============================================================ */

    const fetchSchools = async () => {

        try {

            const response = await api.get(
                '/owner/schools'
            );

            setSchools(
                Array.isArray(response.data)
                    ? response.data
                    : response.data?.data || []
            );

        } catch (error) {

            console.error(
                'Fetch schools error:',
                error
            );
        }
    };


    /* ============================================================
       FETCH STATS
       ============================================================ */

    const fetchStats = async () => {

        try {

            const response = await api.get(
                '/owner/id-cards/stats'
            );

            setStats(response.data || null);

        } catch (error) {

            console.error(
                'Fetch stats error:',
                error
            );
        }
    };


    /* ============================================================
       FETCH ID CARDS
       ============================================================ */

    const fetchCards = async () => {

        setLoading(true);

        try {

            const params = new URLSearchParams();

            if (filter.schoolId) {
                params.append(
                    'schoolId',
                    filter.schoolId
                );
            }

            if (filter.status) {
                params.append(
                    'status',
                    filter.status
                );
            }

            if (filter.search) {
                params.append(
                    'search',
                    filter.search
                );
            }

            if (filter.dateFrom) {
                params.append(
                    'dateFrom',
                    filter.dateFrom
                );
            }

            if (filter.dateTo) {
                params.append(
                    'dateTo',
                    filter.dateTo
                );
            }

            params.append(
                'limit',
                pagination.limit
            );

            params.append(
                'offset',
                pagination.offset
            );

            const response = await api.get(
                `/owner/id-cards?${params.toString()}`
            );

            const responseData = response.data || {};

            const rawCards = Array.isArray(
                responseData
            )
                ? responseData
                : responseData.data || [];

            const normalizedCards = rawCards.map(
                normalizeCard
            );

            setCards(normalizedCards);

            setPagination(prev => ({
                ...prev,
                total:
                    responseData.pagination?.total ||
                    0
            }));

        } catch (error) {

            console.error(
                'Fetch cards error:',
                error
            );

            toast.error(
                'Failed to fetch ID cards'
            );

        } finally {

            setLoading(false);
        }
    };


    /* ============================================================
       STATUS
       ============================================================ */

    const handleStatusToggle = async (
        id,
        currentStatus
    ) => {

        const newStatus =
            currentStatus === 'ACTIVE'
                ? 'INACTIVE'
                : 'ACTIVE';

        try {

            await api.patch(
                `/owner/id-cards/${id}/status`,
                {
                    status: newStatus
                }
            );

            toast.success(
                `ID card ${newStatus.toLowerCase()}`
            );

            fetchCards();
            fetchStats();

        } catch (error) {

            console.error(
                'Status update error:',
                error
            );

            toast.error(
                'Failed to update status'
            );
        }
    };


    /* ============================================================
       DELETE
       ============================================================ */

    const handleDelete = async (id) => {

        if (
            !window.confirm(
                'Are you sure you want to delete this ID card?'
            )
        ) {
            return;
        }

        try {

            await api.delete(
                `/owner/id-cards/${id}`
            );

            toast.success(
                'ID card deleted successfully'
            );

            fetchCards();
            fetchStats();

        } catch (error) {

            console.error(
                'Delete error:',
                error
            );

            toast.error(
                'Failed to delete ID card'
            );
        }
    };


    /* ============================================================
       VIEW DETAILS
       ============================================================ */

    const handleViewDetails = async (id) => {

        setDetailsLoading(true);

        setImageErrors({
            front: false,
            back: false
        });

        try {

            const response = await api.get(
                `/owner/id-cards/${id}`
            );

            let cardData =
                response.data || {};

            /*
            | Some APIs return:
            |
            | {
            |   success: true,
            |   card: {...}
            | }
            |
            | Support that too.
            */
            if (
                cardData.card &&
                typeof cardData.card === 'object'
            ) {

                cardData = {
                    ...cardData,
                    ...cardData.card
                };
            }

            /*
            | Normalize student fields.
            */
            cardData = normalizeCard(
                cardData
            );

            /*
            | If back image is not generated,
            | load Owner's back template.
            */
            cardData =
                await loadBackTemplateIfNeeded(
                    cardData
                );

            /*
            | Normalize again because images.back
            | may have been added above.
            */
            cardData = normalizeCard(
                cardData
            );

            console.log(
                'ID CARD DETAILS:',
                cardData
            );

            console.log(
                'STUDENT:',
                cardData.student
            );

            console.log(
                'FRONT IMAGE:',
                cardData.images.front
            );

            console.log(
                'BACK IMAGE:',
                cardData.images.back
            );

            setSelectedCard(
                cardData
            );

            setShowDetailsModal(
                true
            );

        } catch (error) {

            console.error(
                'Details fetch error:',
                error
            );

            console.error(
                'Details response:',
                error.response?.data
            );

            toast.error(
                'Failed to fetch card details'
            );

        } finally {

            setDetailsLoading(false);
        }
    };


    /* ============================================================
       IMAGE ERROR
       ============================================================ */

    const handleImageError = (
        side,
        url
    ) => {

        console.error(
            `${side} image failed to load:`,
            url
        );

        setImageErrors(prev => ({
            ...prev,
            [side]: true
        }));
    };


    /* ============================================================
       DOWNLOAD
       ============================================================ */

    // Trigger a real browser download for an image URL. Cross-origin URLs
    // ignore the `download` attribute, so the file is fetched as a blob first
    // and downloaded through a temporary object URL. Falls back to opening in
    // a new tab if the fetch fails.
    const triggerImageDownload = async (url, filename) => {

        try {

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'id-card.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);

        } catch (err) {

            console.warn('Blob download failed, opening in tab instead:', err);

            window.open(
                url,
                '_blank',
                'noopener,noreferrer'
            );
        }
    };

    const handleDownload = async (id) => {

        try {

            const response = await api.get(
                `/owner/id-cards/${id}/download`
            );

            const data =
                response.data || {};

            let front = firstValue(
                data.downloadUrls?.front,
                data.images?.front,
                data.front_image_url,
                data.frontImageUrl,
                data.front_image,
                data.frontImage
            );

            let back = firstValue(
                data.downloadUrls?.back,
                data.images?.back,
                data.back_image_url,
                data.backImageUrl,
                data.back_image,
                data.backImage
            );

            front = getImageUrl(front);
            back = getImageUrl(back);

            /*
            | If backend download API did not provide
            | URLs, use the details API.
            */
            if (!front && !back) {

                const detailResponse =
                    await api.get(
                        `/owner/id-cards/${id}`
                    );

                let cardData =
                    detailResponse.data || {};

                if (
                    cardData.card &&
                    typeof cardData.card === 'object'
                ) {

                    cardData = {
                        ...cardData,
                        ...cardData.card
                    };
                }

                cardData =
                    normalizeCard(
                        cardData
                    );

                cardData =
                    await loadBackTemplateIfNeeded(
                        cardData
                    );

                cardData =
                    normalizeCard(
                        cardData
                    );

                front =
                    cardData.images.front;

                back =
                    cardData.images.back;
            }

            if (!front && !back) {

                toast.error(
                    'No downloadable ID card images found'
                );

                return;
            }

            toast.success(
                'Download started'
            );

            const name = (
                normalizeStudentData(data.card || data).name ||
                `id-card-${id}`
            ).replace(/[^\w\-]+/g, '_');

            if (front) {

                await triggerImageDownload(
                    front,
                    `${name}-front.jpg`
                );
            }

            if (back) {

                // Staggered so the browser registers both downloads from one click.
                await new Promise(resolve => setTimeout(resolve, 500));

                await triggerImageDownload(
                    back,
                    `${name}-back.jpg`
                );
            }

        } catch (error) {

            console.error(
                'Download error:',
                error
            );

            toast.error(
                'Failed to download ID card'
            );
        }
    };


    /* ============================================================
       FILTER
       ============================================================ */

    const handleFilterChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFilter(prev => ({
            ...prev,
            [name]: value
        }));

        setPagination(prev => ({
            ...prev,
            offset: 0
        }));
    };


    const handleResetFilter = () => {

        setFilter({
            schoolId: '',
            status: '',
            search: '',
            dateFrom: '',
            dateTo: ''
        });

        setPagination(prev => ({
            ...prev,
            offset: 0
        }));
    };


    /* ============================================================
       STATUS BADGE
       ============================================================ */

    const getStatusBadge = (
        status
    ) => {

        const colors = {
            ACTIVE: 'bg-success',
            INACTIVE: 'bg-secondary',
            REVOKED: 'bg-danger'
        };

        return (
            <span
                className={`badge ${
                    colors[status] ||
                    'bg-secondary'
                }`}
            >
                {status || 'UNKNOWN'}
            </span>
        );
    };


    /* ============================================================
       SAFE DATE
       ============================================================ */

    const formatDate = (
        value,
        withTime = false
    ) => {

        if (!value) {
            return 'N/A';
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return value;
        }

        return date.toLocaleString(
            'en-GB',
            withTime
                ? {
                    weekday: 'short',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }
                : {
                    weekday: 'short',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }
        );
    };


    /* ============================================================
       RENDER
       ============================================================ */

    return (

        <div>

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="mb-1">
                        ID Cards
                    </h2>

                    <p className="text-muted">
                        View and manage all ID cards across schools
                    </p>

                </div>

                <div>

                    <button
                        className="btn btn-outline-secondary me-2"
                        onClick={() => {
                            fetchCards();
                            fetchStats();
                        }}
                    >
                        <FaSync className="me-1" />
                        Refresh
                    </button>

                </div>

            </div>


            {/* =====================================================
                STATS
            ===================================================== */}

            {stats && (

                <div className="row g-4 mb-4">

                    <div className="col-md-3">

                        <div className="stat-card">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <div className="stat-number">
                                        {stats.summary?.total_cards || 0}
                                    </div>

                                    <div className="stat-label">
                                        Total ID Cards
                                    </div>

                                </div>

                                <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                                    <FaIdCard />
                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="col-md-3">

                        <div className="stat-card">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <div className="stat-number">
                                        {stats.summary?.unique_students || 0}
                                    </div>

                                    <div className="stat-label">
                                        Unique Students
                                    </div>

                                </div>

                                <div className="stat-icon bg-success bg-opacity-10 text-success">
                                    <FaUserGraduate />
                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="col-md-3">

                        <div className="stat-card">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <div className="stat-number">
                                        {stats.summary?.total_schools || 0}
                                    </div>

                                    <div className="stat-label">
                                        Schools
                                    </div>

                                </div>

                                <div className="stat-icon bg-info bg-opacity-10 text-info">
                                    <FaSchool />
                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="col-md-3">

                        <div className="stat-card">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <div className="stat-number">
                                        {stats.summary?.last_generated_date || 'N/A'}
                                    </div>

                                    <div className="stat-label">
                                        Last Generated
                                    </div>

                                </div>

                                <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                                    <FaCalendarAlt />
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                FILTERS
            ===================================================== */}

            <div className="card mb-4">

                <div className="card-body">

                    <div className="row">

                        <div className="col-md-3 mb-2">

                            <label className="form-label">
                                School
                            </label>

                            <select
                                className="form-select"
                                name="schoolId"
                                value={filter.schoolId}
                                onChange={handleFilterChange}
                            >

                                <option value="">
                                    All Schools
                                </option>

                                {schools.map(
                                    school => (

                                        <option
                                            key={school.id}
                                            value={school.id}
                                        >
                                            {school.name}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        <div className="col-md-2 mb-2">

                            <label className="form-label">
                                Status
                            </label>

                            <select
                                className="form-select"
                                name="status"
                                value={filter.status}
                                onChange={handleFilterChange}
                            >

                                <option value="">
                                    All
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>

                                <option value="REVOKED">
                                    Revoked
                                </option>

                            </select>

                        </div>


                        <div className="col-md-2 mb-2">

                            <label className="form-label">
                                Date From
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                name="dateFrom"
                                value={filter.dateFrom}
                                onChange={handleFilterChange}
                            />

                        </div>


                        <div className="col-md-2 mb-2">

                            <label className="form-label">
                                Date To
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                name="dateTo"
                                value={filter.dateTo}
                                onChange={handleFilterChange}
                            />

                        </div>


                        <div className="col-md-3 mb-2 d-flex align-items-end">

                            <div className="d-flex w-100">

                                <input
                                    type="text"
                                    className="form-control me-2"
                                    placeholder="Search by student..."
                                    name="search"
                                    value={filter.search}
                                    onChange={handleFilterChange}
                                />

                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={handleResetFilter}
                                >
                                    Reset
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =====================================================
                TABLE
            ===================================================== */}

            <div className="card">

                <div className="card-body">

                    {loading ? (

                        <div className="text-center py-5">

                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>

                            <p className="mt-2 text-muted">
                                Loading ID cards...
                            </p>

                        </div>

                    ) : cards.length > 0 ? (

                        <div className="table-responsive">

                            <table className="table table-hover">

                                <thead>

                                    <tr>

                                        <th>
                                            Card #
                                        </th>

                                        <th>
                                            Student
                                        </th>

                                        <th>
                                            School
                                        </th>

                                        <th>
                                            Design
                                        </th>

                                        <th>
                                            Generated
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {cards.map(
                                        card => (

                                            <tr
                                                key={card.id}
                                            >

                                                <td>

                                                    <code className="small">
                                                        {card.card_number || card.cardNumber || 'N/A'}
                                                    </code>

                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            firstValue(
                                                                card.student?.name,
                                                                card.student_name,
                                                                card.studentName,
                                                                card.name,
                                                                'N/A'
                                                            )
                                                        }
                                                    </strong>

                                                    <br />

                                                    <small className="text-muted">

                                                        {
                                                            firstValue(
                                                                card.student?.admission_number,
                                                                card.admission_number,
                                                                card.admissionNumber,
                                                                ''
                                                            )
                                                        }

                                                    </small>

                                                </td>


                                                <td>
                                                    {
                                                        firstValue(
                                                            card.school_name,
                                                            card.schoolName,
                                                            card.school?.name,
                                                            'N/A'
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        firstValue(
                                                            card.design_name,
                                                            card.designName,
                                                            card.design?.name,
                                                            'N/A'
                                                        )
                                                    }
                                                </td>


                                                <td>
                                                    {formatDate(
                                                        firstValue(
                                                            card.generated_at,
                                                            card.generatedAt
                                                        )
                                                    )}
                                                </td>


                                                <td>
                                                    {getStatusBadge(
                                                        card.status
                                                    )}
                                                </td>


                                                <td>

                                                    <div className="btn-group btn-group-sm">

                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() =>
                                                                handleViewDetails(
                                                                    card.id
                                                                )
                                                            }
                                                            title="View Details"
                                                        >
                                                            <FaEye />
                                                        </button>


                                                        <button
                                                            className="btn btn-outline-success"
                                                            onClick={() =>
                                                                handleDownload(
                                                                    card.id
                                                                )
                                                            }
                                                            title="Download"
                                                        >
                                                            <FaDownload />
                                                        </button>


                                                        <button
                                                            className={`btn ${
                                                                card.status === 'ACTIVE'
                                                                    ? 'btn-outline-warning'
                                                                    : 'btn-outline-success'
                                                            }`}
                                                            onClick={() =>
                                                                handleStatusToggle(
                                                                    card.id,
                                                                    card.status
                                                                )
                                                            }
                                                            title={
                                                                card.status === 'ACTIVE'
                                                                    ? 'Deactivate'
                                                                    : 'Activate'
                                                            }
                                                        >
                                                            {
                                                                card.status === 'ACTIVE'
                                                                    ? 'Deactivate'
                                                                    : 'Activate'
                                                            }
                                                        </button>


                                                        <button
                                                            className="btn btn-outline-danger"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    card.id
                                                                )
                                                            }
                                                            title="Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        <div className="text-center py-5">

                            <FaIdCard
                                size={48}
                                className="text-muted mb-3"
                            />

                            <h5 className="text-muted">
                                No ID cards found
                            </h5>

                            <p className="text-muted">
                                Try adjusting your filters or generate some ID cards
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        PAGINATION
                    ================================================= */}

                    {cards.length > 0 && (

                        <div className="d-flex justify-content-between align-items-center mt-3">

                            <span className="text-muted small">

                                Showing{' '}

                                {pagination.offset + 1}

                                {' '}to{' '}

                                {Math.min(
                                    pagination.offset +
                                    pagination.limit,
                                    pagination.total
                                )}

                                {' '}of{' '}

                                {pagination.total}

                            </span>


                            <div>

                                <button
                                    className="btn btn-outline-secondary btn-sm me-2"
                                    onClick={() =>
                                        setPagination(
                                            prev => ({
                                                ...prev,
                                                offset:
                                                    Math.max(
                                                        0,
                                                        prev.offset -
                                                        prev.limit
                                                    )
                                            })
                                        )
                                    }
                                    disabled={
                                        pagination.offset === 0
                                    }
                                >
                                    Previous
                                </button>


                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() =>
                                        setPagination(
                                            prev => ({
                                                ...prev,
                                                offset:
                                                    prev.offset +
                                                    prev.limit
                                            })
                                        )
                                    }
                                    disabled={
                                        pagination.offset +
                                        pagination.limit >=
                                        pagination.total
                                    }
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    )}

                </div>

            </div>


            {/* =====================================================
                DETAILS MODAL
            ===================================================== */}

            {showDetailsModal && selectedCard && (

                <div
                    className="modal show d-block"
                    style={{
                        backgroundColor:
                            'rgba(0,0,0,0.5)'
                    }}
                >

                    <div className="modal-dialog modal-xl">

                        <div className="modal-content">


                            {/* HEADER */}

                            <div className="modal-header">

                                <h5 className="modal-title">
                                    ID Card Details
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setShowDetailsModal(
                                            false
                                        )
                                    }
                                />

                            </div>


                            {/* BODY */}

                            <div className="modal-body">

                                {detailsLoading ? (

                                    <div className="text-center py-5">

                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        />

                                        <p className="mt-3">
                                            Loading ID card details...
                                        </p>

                                    </div>

                                ) : (

                                    <>

                                        {/* =================================
                                            INFORMATION
                                        ================================= */}

                                        <div className="row">

                                            {/* STUDENT */}

                                            <div className="col-md-6">

                                                <h6 className="mb-3">
                                                    Student Information
                                                </h6>


                                                <div className="mb-2">

                                                    <strong>
                                                        Name:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.name ||
                                                        'N/A'
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Father's Name:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.father_name ||
                                                        'N/A'
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Class:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.class ||
                                                        'N/A'
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Section:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.section ||
                                                        'N/A'
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Admission No:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.admission_number ||
                                                        'N/A'
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Roll No:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.roll_number ||
                                                        'N/A'
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Phone:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.phone ||
                                                        'N/A'
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        DOB:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.dob ||
                                                        'N/A'
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Address:
                                                    </strong>{' '}

                                                    {
                                                        selectedCard.student?.address ||
                                                        'N/A'
                                                    }

                                                </div>

                                            </div>


                                            {/* CARD */}

                                            <div className="col-md-6">

                                                <h6 className="mb-3">
                                                    Card Information
                                                </h6>


                                                <div className="mb-2">

                                                    <strong>
                                                        Card Number:
                                                    </strong>{' '}

                                                    {
                                                        firstValue(
                                                            selectedCard.card_number,
                                                            selectedCard.cardNumber,
                                                            'N/A'
                                                        )
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Design:
                                                    </strong>{' '}

                                                    {
                                                        firstValue(
                                                            selectedCard.design_name,
                                                            selectedCard.designName,
                                                            selectedCard.design?.name,
                                                            'N/A'
                                                        )
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        School:
                                                    </strong>{' '}

                                                    {
                                                        firstValue(
                                                            selectedCard.school_name,
                                                            selectedCard.schoolName,
                                                            selectedCard.school?.name,
                                                            'N/A'
                                                        )
                                                    }

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Generated:
                                                    </strong>{' '}

                                                    {formatDate(
                                                        firstValue(
                                                            selectedCard.generated_at,
                                                            selectedCard.generatedAt
                                                        ),
                                                        true
                                                    )}

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Status:
                                                    </strong>{' '}

                                                    {getStatusBadge(
                                                        selectedCard.status
                                                    )}

                                                </div>


                                                <div className="mb-2">

                                                    <strong>
                                                        Generated By:
                                                    </strong>{' '}

                                                    {
                                                        firstValue(
                                                            selectedCard.generated_by_email,
                                                            selectedCard.generatedByEmail,
                                                            selectedCard.generated_by,
                                                            'System'
                                                        )
                                                    }

                                                </div>

                                            </div>

                                        </div>


                                        {/* =================================
                                            IMAGE PREVIEW
                                        ================================= */}

                                        <div className="row mt-4">

                                            {/* FRONT */}

                                            <div className="col-md-6">

                                                <div className="card h-100">

                                                    <div className="card-header text-center fw-bold">

                                                        Front Side

                                                    </div>

                                                    <div
                                                        className="card-body d-flex justify-content-center align-items-center"
                                                        style={{
                                                            minHeight: '350px',
                                                            background:
                                                                '#f8f9fa'
                                                        }}
                                                    >

                                                        {selectedCard.images?.front &&
                                                        !imageErrors.front ? (

                                                            <img
                                                                src={
                                                                    selectedCard.images.front
                                                                }
                                                                alt="ID Card Front"
                                                                className="img-fluid border rounded shadow-sm"
                                                                style={{
                                                                    maxHeight:
                                                                        '330px',
                                                                    maxWidth:
                                                                        '100%',
                                                                    objectFit:
                                                                        'contain'
                                                                }}
                                                                onError={() =>
                                                                    handleImageError(
                                                                        'front',
                                                                        selectedCard.images.front
                                                                    )
                                                                }
                                                            />

                                                        ) : (

                                                            <div className="text-center text-muted">

                                                                <FaIdCard
                                                                    size={50}
                                                                    className="mb-3"
                                                                />

                                                                <div>
                                                                    {
                                                                        imageErrors.front
                                                                            ? 'Front image could not be loaded'
                                                                            : 'No front image'
                                                                    }
                                                                </div>

                                                                {selectedCard.images?.front && (

                                                                    <small className="d-block mt-2 text-danger">
                                                                        Check browser console for image URL
                                                                    </small>

                                                                )}

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>


                                            {/* BACK */}

                                            <div className="col-md-6">

                                                <div className="card h-100">

                                                    <div className="card-header text-center fw-bold">

                                                        Back Side

                                                    </div>

                                                    <div
                                                        className="card-body d-flex justify-content-center align-items-center"
                                                        style={{
                                                            minHeight: '350px',
                                                            background:
                                                                '#f8f9fa'
                                                        }}
                                                    >

                                                        {selectedCard.images?.back &&
                                                        !imageErrors.back ? (

                                                            <img
                                                                src={
                                                                    selectedCard.images.back
                                                                }
                                                                alt="ID Card Back"
                                                                className="img-fluid border rounded shadow-sm"
                                                                style={{
                                                                    maxHeight:
                                                                        '330px',
                                                                    maxWidth:
                                                                        '100%',
                                                                    objectFit:
                                                                        'contain'
                                                                }}
                                                                onError={() =>
                                                                    handleImageError(
                                                                        'back',
                                                                        selectedCard.images.back
                                                                    )
                                                                }
                                                            />

                                                        ) : (

                                                            <div className="text-center text-muted">

                                                                <FaIdCard
                                                                    size={50}
                                                                    className="mb-3"
                                                                />

                                                                <div>
                                                                    {
                                                                        imageErrors.back
                                                                            ? 'Back image could not be loaded'
                                                                            : 'No back image'
                                                                    }
                                                                </div>

                                                                {selectedCard.images?.back && (

                                                                    <small className="d-block mt-2 text-danger">
                                                                        Check browser console for image URL
                                                                    </small>

                                                                )}

                                                            </div>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        </div>


                                        {/* =================================
                                            DEBUG INFORMATION
                                            Remove later if desired
                                        ================================= */}

                                        {/* <div className="mt-3">

                                            <details>

                                                <summary
                                                    className="text-muted small"
                                                    style={{
                                                        cursor:
                                                            'pointer'
                                                    }}
                                                >
                                                    Technical image information
                                                </summary>

                                                <div className="mt-2 p-2 bg-light rounded">

                                                    <div className="small">

                                                        <strong>
                                                            Front URL:
                                                        </strong>

                                                        <div
                                                            style={{
                                                                wordBreak:
                                                                    'break-all'
                                                            }}
                                                        >
                                                            {
                                                                selectedCard.images?.front ||
                                                                'NONE'
                                                            }
                                                        </div>

                                                    </div>


                                                    <hr />


                                                    <div className="small">

                                                        <strong>
                                                            Back URL:
                                                        </strong>

                                                        <div
                                                            style={{
                                                                wordBreak:
                                                                    'break-all'
                                                            }}
                                                        >
                                                            {
                                                                selectedCard.images?.back ||
                                                                'NONE'
                                                            }
                                                        </div>

                                                    </div>

                                                </div>

                                            </details>

                                        </div> */}

                                    </>

                                )}

                            </div>


                            {/* FOOTER */}

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setShowDetailsModal(
                                            false
                                        )
                                    }
                                >
                                    Close
                                </button>


                                <button
                                    className="btn btn-primary"
                                    onClick={() =>
                                        handleDownload(
                                            selectedCard.id
                                        )
                                    }
                                >

                                    <FaDownload className="me-2" />

                                    Download

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default IDCards;