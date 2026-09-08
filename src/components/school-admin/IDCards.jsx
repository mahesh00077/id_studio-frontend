import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  FaDownload,
  FaEye,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

/*
 * ---------------------------------------------------------------
 * SideImage
 *
 * Self-contained image preview for one side (front/back) of an ID
 * card inside the details modal:
 *   - Shows a centered spinner while the image is loading.
 *   - Shows a "Failed to load" message if the image errors.
 *   - Container keeps a FIXED size so the layout never shifts.
 *   - Keyed by `src` upstream, so state resets every time the modal
 *     is opened with a new card / URL.
 * ---------------------------------------------------------------
 */
function SideImage({ src, alt }) {
  // 'loading' | 'loaded' | 'error'
  const [status, setStatus] = useState('loading');

  /*
   * If the src changes (new card opened), reset to loading so the
   * loader is shown again for the new image.
   */
  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  if (!src) {
    return (
      <div
        className="d-flex align-items-center justify-content-center text-muted"
        style={{
          width: '300px',
          height: '420px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: '#f8f9fa',
          margin: '0 auto',
        }}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '300px',
        height: '420px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        background: '#f8f9fa',
        margin: '0 auto',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Loader — only while this side's image is still loading */}
      {status === 'loading' && (
        <div
          className="text-muted"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <FaSpinner className="fa-spin" size={28} />
        </div>
      )}

      {/* Error message replaces the area when loading fails */}
      {status === 'error' && (
        <div
          className="text-muted"
          style={{
            padding: '12px',
            textAlign: 'center',
          }}
        >
          Image unavailable / Failed to load
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        style={{
          maxWidth: '280px',
          maxHeight: '400px',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          display: status === 'loaded' ? 'block' : 'none',
        }}
      />
    </div>
  );
}

function IDCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState('');

  const [viewCard, setViewCard] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  // Synchronous duplicate-click guard for downloads.
  const downloadingRef = useRef(false);

  /*
   * ---------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------
   */

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

    return null;
  };

  const getObjectValue = (obj, keys = []) => {
    if (!obj || typeof obj !== 'object') {
      return null;
    }

    for (const key of keys) {
      if (
        obj[key] !== undefined &&
        obj[key] !== null &&
        String(obj[key]).trim() !== ''
      ) {
        return obj[key];
      }
    }

    return null;
  };

  /*
   * API responses can contain:
   *
   * card.student_name
   * card.studentName
   * card.name
   *
   * OR
   *
   * card.student.name
   * card.student.student_name
   *
   * OR
   *
   * card.studentDetails.name
   *
   * Normalize everything here.
   */
  const normalizeCard = (raw) => {
    const card = raw || {};

    const student =
      card.student ||
      card.studentDetails ||
      card.student_detail ||
      card.studentData ||
      {};

    const design =
      card.design ||
      card.designDetails ||
      card.design_detail ||
      {};

    const school =
      card.school ||
      card.schoolDetails ||
      card.school_detail ||
      {};

    const studentName = firstValue(
      card.student_name,
      card.studentName,
      card.name,

      student.student_name,
      student.studentName,
      student.name,

      card.student?.full_name,
      card.student?.fullName
    );

    const admissionNumber = firstValue(
      card.admission_number,
      card.admissionNumber,
      card.admission_no,
      card.admissionNo,

      student.admission_number,
      student.admissionNumber,
      student.admission_no,
      student.admissionNo
    );

    const className = firstValue(
      card.class,
      card.class_name,
      card.className,
      card.class_id,

      student.class,
      student.class_name,
      student.className,
      student.class_id,

      card.classDetails?.name,
      card.class_details?.name
    );

    const sectionName = firstValue(
      card.section,
      card.section_name,
      card.sectionName,
      card.section_id,

      student.section,
      student.section_name,
      student.sectionName,
      student.section_id,

      card.sectionDetails?.name,
      card.section_details?.name
    );

    const fatherName = firstValue(
      card.father_name,
      card.fatherName,

      student.father_name,
      student.fatherName
    );

    const address = firstValue(
      card.address,

      student.address
    );

    const phone = firstValue(
      card.phone,
      card.mobile,
      card.mobile_no,
      card.mobile_number,

      student.phone,
      student.mobile,
      student.mobile_no,
      student.mobile_number
    );

    const designName = firstValue(
      card.design_name,
      card.designName,

      design.name,
      design.design_name,
      design.designName
    );

    const schoolName = firstValue(
      card.school_name,
      card.schoolName,

      school.name,
      school.school_name,
      school.schoolName
    );

    const cardNumber = firstValue(
      card.card_number,
      card.cardNumber,
      card.number
    );

    const generatedAt = firstValue(
      card.generated_at,
      card.generatedAt,
      card.created_at,
      card.createdAt
    );

    const status = firstValue(
      card.status,
      card.card_status,
      'ACTIVE'
    );

    return {
      ...card,

      _studentName: studentName || '-',
      _admissionNumber: admissionNumber || '-',
      _class: className || '-',
      _section: sectionName || '-',
      _fatherName: fatherName || '-',
      _phone: phone || '-',
      _address: address || '-',
      _designName: designName || '-',
      _schoolName: schoolName || '-',
      _cardNumber: cardNumber || '-',
      _generatedAt: generatedAt,
      _status: status,

      /*
       * Keep original nested objects available.
       */
      _student: student,
      _design: design,
      _school: school,
    };
  };

  /*
   * ---------------------------------------------------------
   * Date
   * ---------------------------------------------------------
   */

  const formatDate = (dateStr) => {
    if (!dateStr) {
      return '-';
    }

    const d = new Date(dateStr);

    if (Number.isNaN(d.getTime())) {
      return '-';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  /*
   * ---------------------------------------------------------
   * Download helper
   * ---------------------------------------------------------
   */

  const downloadUrl = async (url, filename) => {
    if (!url) {
      return false;
    }

    try {
      /*
       * data:image/... URLs can be downloaded directly.
       */
      if (
        typeof url === 'string' &&
        url.startsWith('data:')
      ) {
        const a = document.createElement('a');

        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        return true;
      }

      /*
       * Blob / normal URL.
       *
       * Fetching first avoids many browser problems with
       * cross-origin downloads.
       */
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status}`
        );
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error('Empty download');
      }

      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = blobUrl;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      return true;
    } catch (error) {
      console.error('downloadUrl error:', error);

      /*
       * Fallback:
       * browser direct download.
       */
      try {
        const a = document.createElement('a');

        a.href = url;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        document.body.appendChild(a);
        a.click();
        a.remove();

        return true;
      } catch (fallbackError) {
        console.error(
          'Download fallback error:',
          fallbackError
        );

        return false;
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * Extract download URL
   * ---------------------------------------------------------
   */

  const findImageUrl = (data, side) => {
    if (!data) {
      return null;
    }

    const downloadUrls =
      data.downloadUrls ||
      data.download_urls ||
      data.urls ||
      {};

    const card =
      data.card ||
      data.idCard ||
      data.id_card ||
      {};

    const sideObject =
      side === 'front'
        ? (
            data.front ||
            data.frontImage ||
            data.front_image ||
            {}
          )
        : (
            data.back ||
            data.backImage ||
            data.back_image ||
            {}
          );

    const candidates =
      side === 'front'
        ? [
            downloadUrls.front,
            downloadUrls.frontUrl,
            downloadUrls.front_url,

            data.frontUrl,
            data.front_url,

            card.frontImageUrl,
            card.front_image_url,
            card.frontImage,
            card.front_image,
            card.front_template,

            sideObject.url,
            sideObject.imageUrl,
            sideObject.image_url,
          ]
        : [
            downloadUrls.back,
            downloadUrls.backUrl,
            downloadUrls.back_url,

            data.backUrl,
            data.back_url,

            card.backImageUrl,
            card.back_image_url,
            card.backImage,
            card.back_image,
            card.back_template,

            sideObject.url,
            sideObject.imageUrl,
            sideObject.image_url,
          ];

    for (const value of candidates) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        return value;
      }
    }

    return null;
  };

  /*
   * ---------------------------------------------------------
   * Fetch cards
   * ---------------------------------------------------------
   */

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);

    try {
      const response = await api.get(
        '/school-admin/id-cards/history'
      );

      console.log(
        'ID CARD HISTORY RESPONSE:',
        response.data
      );

      /*
       * Support:
       *
       * response.data = []
       *
       * response.data.cards = []
       *
       * response.data.data = []
       *
       * response.data.idCards = []
       */
      let list = [];

      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (
        Array.isArray(response.data?.cards)
      ) {
        list = response.data.cards;
      } else if (
        Array.isArray(response.data?.data)
      ) {
        list = response.data.data;
      } else if (
        Array.isArray(response.data?.idCards)
      ) {
        list = response.data.idCards;
      } else if (
        Array.isArray(response.data?.id_cards)
      ) {
        list = response.data.id_cards;
      }

      const normalized = list.map(normalizeCard);

      console.log(
        'NORMALIZED ID CARDS:',
        normalized
      );

      setCards(normalized);
    } catch (error) {
      console.error(
        'Failed to fetch ID cards:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
        'Failed to fetch ID cards'
      );

      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * View card
   * ---------------------------------------------------------
   */

  const handleView = async (card) => {
    setViewLoading(true);
    setViewCard(card);

    try {
      const response = await api.get(
        `/school-admin/id-cards/${card.id}/download`
      );

      console.log(
        'ID CARD VIEW RESPONSE:',
        response.data
      );

      const data = response.data || {};

      const front = findImageUrl(data, 'front');

      const back = findImageUrl(data, 'back');

      setViewCard({
        ...card,
        _frontUrl: front,
        _backUrl: back,
        // true => back shown is the design's template, no generated back side.
        _backIsTemplate: !!data.backIsTemplate,
      });
    } catch (error) {
      console.error(
        'Failed to load card:',
        error
      );

      toast.error(
        'Failed to load ID card preview'
      );
    } finally {
      setViewLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Download
   * ---------------------------------------------------------
   */

  const handleDownload = async (card) => {
    if (!card?.id) {
      toast.error('Invalid ID card');
      return;
    }

    // Ref-based guard: double-clicks fire before state updates, so a state
    // check alone cannot prevent duplicate download requests.
    if (downloadingRef.current) {
      return;
    }
    downloadingRef.current = true;
    setDownloadingId(card.id);

    try {
      const response = await api.get(
        `/school-admin/id-cards/${card.id}/download`
      );

      const data = response.data || {};

      /*
       * Student name for filename (from the clicked card row, falling back
       * to the fresh API payload for the SAME card id).
       */
      const apiCard = data.card || {};
      const studentName = firstValue(
        card._studentName !== '-' ? card._studentName : null,
        apiCard.student_name,
        apiCard.studentName,
        data.student_name,
        data.studentName,
        'student'
      );

      /*
       * Sanitize filename.
       */
      const safeName = String(studentName)
        .replace(/[<>:"/\\|?*]+/g, '_')
        .replace(/\s+/g, '_');

      const frontUrl = findImageUrl(data, 'front');
      const backUrl = findImageUrl(data, 'back');

      /*
       * Download whichever sides actually exist on THIS card. Track each
       * side separately so we can report exactly what happened.
       */
      let frontOk = false;
      let backOk = false;

      if (frontUrl) {
        frontOk = await downloadUrl(frontUrl, `${safeName}_front.jpg`);
        if (!frontOk) {
          toast.error('Failed to download the Front image');
        }
      }

      if (backUrl) {
        /*
         * Small delay prevents browsers from blocking the second
         * automatic download.
         */
        await new Promise((resolve) => setTimeout(resolve, 700));
        backOk = await downloadUrl(backUrl, `${safeName}_back.jpg`);
        if (!backOk) {
          toast.error('Failed to download the Back image');
        }
      }

      if (!frontUrl && !backUrl) {
        /*
         * Sometimes backend may return a single direct URL instead of
         * downloadUrls.
         */
        const directUrl =
          data.url ||
          data.downloadUrl ||
          data.download_url ||
          data.file ||
          data.fileUrl ||
          data.file_url;

        if (directUrl) {
          frontOk = await downloadUrl(directUrl, `${safeName}_front.jpg`);
        }

        if (!frontOk) {
          console.error('No downloadable image found:', data);
          toast.error(
            'No saved card images were found for this ID card. Nothing was downloaded.'
          );
          return;
        }

        toast.success('ID card download started');
        return;
      }

      /*
       * Clear per-side feedback: success only for sides that exist and
       * downloaded; explicit notice for a missing Back/Front side.
       */
      if (frontOk && backOk) {
        toast.success(
          data.backIsTemplate
            ? 'Front and Back downloaded (Back used the design template)'
            : 'Front and Back images downloaded'
        );
      } else if (frontOk && !backUrl) {
        toast.success('Front image downloaded (no Back image saved for this card)');
      } else if (backOk && !frontUrl) {
        toast.success('Back image downloaded (no Front image saved for this card)');
      } else if (frontOk || backOk) {
        // One side failed above; its specific error was already shown.
        toast.error('ID card partially downloaded — see the error above');
      }
    } catch (error) {
      console.error(
        'ID card download error:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
        'Failed to download ID card'
      );
    } finally {
      downloadingRef.current = false;
      setDownloadingId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * Search
   * ---------------------------------------------------------
   */

  const filteredCards = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    if (!q) {
      return cards;
    }

    return cards.filter((card) => {
      const studentName =
        String(card._studentName || '')
          .toLowerCase();

      const cardNumber =
        String(card._cardNumber || '')
          .toLowerCase();

      const admission =
        String(card._admissionNumber || '')
          .toLowerCase();

      const className =
        String(card._class || '')
          .toLowerCase();

      const section =
        String(card._section || '')
          .toLowerCase();

      return (
        studentName.includes(q) ||
        cardNumber.includes(q) ||
        admission.includes(q) ||
        className.includes(q) ||
        section.includes(q)
      );
    });
  }, [cards, search]);

  /*
   * ---------------------------------------------------------
   * Loading
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="text-center py-5">
        <FaSpinner
          className="fa-spin me-2"
        />
        Loading ID cards...
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * Render
   * ---------------------------------------------------------
   */

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            ID Cards
          </h2>

          <p className="text-muted mb-0">
            View and manage generated ID cards
          </p>
        </div>

        <Link
          to="/admin/id-cards/generate"
          className="btn btn-primary"
        >
          <FaPlus className="me-2" />
          Generate New
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>

            <input
              type="text"
              className="form-control"
              placeholder="Search by student name, admission number or card number..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Card Number</th>
                  <th>Design</th>
                  <th>Generated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCards.map((card) => (
                  <tr key={card.id}>
                    {/* Student */}
                    <td>
                      <strong>
                        {card._studentName}
                      </strong>

                      {card._admissionNumber !== '-' && (
                        <>
                          <br />

                          <small className="text-muted">
                            {card._admissionNumber}
                          </small>
                        </>
                      )}
                    </td>

                    {/* Class */}
                    <td>
                      {card._class}
                    </td>

                    {/* Section */}
                    <td>
                      {card._section}
                    </td>

                    {/* Card Number */}
                    <td>
                      {card._cardNumber}
                    </td>

                    {/* Design */}
                    <td>
                      {card._designName}
                    </td>

                    {/* Generated */}
                    <td>
                      {formatDate(
                        card._generatedAt
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={
                          `badge ${
                            String(
                              card._status
                            ).toUpperCase() ===
                            'ACTIVE'
                              ? 'bg-success'
                              : 'bg-secondary'
                          }`
                        }
                      >
                        {card._status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="btn-group">
                        {/* View */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          title="View"
                          onClick={() =>
                            handleView(card)
                          }
                        >
                          <FaEye />
                        </button>

                        {/* Download */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          title="Download"
                          disabled={
                            downloadingId ===
                            card.id
                          }
                          onClick={() =>
                            handleDownload(
                              card
                            )
                          }
                        >
                          {downloadingId ===
                          card.id ? (
                            <FaSpinner className="fa-spin" />
                          ) : (
                            <FaDownload />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCards.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center text-muted py-5"
                    >
                      No ID cards found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small mt-2">
            Showing{' '}
            {filteredCards.length}{' '}
            of {cards.length} ID cards
          </div>
        </div>
      </div>

      {/* =====================================================
          VIEW MODAL
          ===================================================== */}
      {viewCard && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{
            background:
              'rgba(0,0,0,0.55)',
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              {/* Header */}
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0">
                    ID Card Details
                  </h5>

                  <small className="text-muted">
                    {viewCard._studentName}
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setViewCard(null)
                  }
                />
              </div>

              {/* Body */}
              <div className="modal-body">
                <div className="row">
                  {/* Student */}
                  <div className="col-md-6">
                    <h6 className="mb-3">
                      Student Information
                    </h6>

                    <div className="mb-2">
                      <strong>Name:</strong>{' '}
                      {viewCard._studentName}
                    </div>

                    <div className="mb-2">
                      <strong>
                        Father's Name:
                      </strong>{' '}
                      {viewCard._fatherName}
                    </div>

                    <div className="mb-2">
                      <strong>Class:</strong>{' '}
                      {viewCard._class}
                    </div>

                    <div className="mb-2">
                      <strong>
                        Section:
                      </strong>{' '}
                      {viewCard._section}
                    </div>

                    <div className="mb-2">
                      <strong>
                        Admission No:
                      </strong>{' '}
                      {viewCard._admissionNumber}
                    </div>

                    <div className="mb-2">
                      <strong>Phone:</strong>{' '}
                      {viewCard._phone}
                    </div>

                    <div className="mb-2">
                      <strong>Address:</strong>{' '}
                      {viewCard._address}
                    </div>
                  </div>

                  {/* Card */}
                  <div className="col-md-6">
                    <h6 className="mb-3">
                      Card Information
                    </h6>

                    <div className="mb-2">
                      <strong>
                        Card Number:
                      </strong>{' '}
                      {viewCard._cardNumber}
                    </div>

                    <div className="mb-2">
                      <strong>
                        Design:
                      </strong>{' '}
                      {viewCard._designName}
                    </div>

                    <div className="mb-2">
                      <strong>
                        School:
                      </strong>{' '}
                      {viewCard._schoolName}
                    </div>

                    <div className="mb-2">
                      <strong>
                        Generated:
                      </strong>{' '}
                      {formatDate(
                        viewCard._generatedAt
                      )}
                    </div>

                    <div className="mb-2">
                      <strong>
                        Status:
                      </strong>{' '}
                      <span
                        className={
                          `badge ${
                            String(
                              viewCard._status
                            ).toUpperCase() ===
                            'ACTIVE'
                              ? 'bg-success'
                              : 'bg-secondary'
                          }`
                        }
                      >
                        {viewCard._status}
                      </span>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Images */}
                <div className="row text-center">
                  {/* Front */}
                  <div className="col-md-6">
                    <h6 className="mb-3">
                      Front Side
                    </h6>

                    {viewLoading ? (
                      <div className="py-5">
                        <FaSpinner className="fa-spin" />
                      </div>
                    ) : (
                      <SideImage
                        src={viewCard._frontUrl}
                        alt="ID Card Front"
                      />
                    )}
                  </div>

                  {/* Back */}
                  <div className="col-md-6">
                    <h6 className="mb-3">
                      Back Side
                    </h6>

                    {viewLoading ? (
                      <div className="py-5">
                        <FaSpinner className="fa-spin" />
                      </div>
                    ) : (
                      <>
                        <SideImage
                          src={viewCard._backUrl}
                          alt="ID Card Back"
                        />
                        {viewCard._backIsTemplate && (
                          <small className="text-muted d-block mt-2">
                            Template design (no generated back side saved)
                          </small>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setViewCard(null)
                  }
                >
                  <FaTimes className="me-2" />
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    downloadingId ===
                    viewCard.id
                  }
                  onClick={() =>
                    handleDownload(
                      viewCard
                    )
                  }
                >
                  {downloadingId ===
                  viewCard.id ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FaDownload className="me-2" />
                      Download
                    </>
                  )}
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