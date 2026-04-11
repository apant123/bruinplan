import React from 'react';

function DegreeProgress({ planItems = [], courseCache = {}, userMajor = '', subjects = [] }) {
  let geUnits = 0;
  let majorUnits = 0;
  let upperDivUnits = 0;
  let totalUnits = 0;

  planItems.forEach(item => {
    const course = courseCache[item.course_id];
    if (!course) return;

    const unitsStr = String(course.units || '0');
    const unitsMatch = unitsStr.match(/(\d+\.?\d*)/);
    const units = unitsMatch ? parseFloat(unitsMatch[1]) : 0;
    
    totalUnits += units;

    const courseNumStr = String(course.number || '');
    const numMatch = courseNumStr.match(/(\d+)/);
    const courseNum = numMatch ? parseInt(numMatch[1], 10) : 0;
    const isUpperDiv = courseNum >= 100;
    
    const subjectCode = course.subjectCode || '';
    const subjectDetails = subjects.find(s => s.code === subjectCode);
    const subjectName = subjectDetails ? subjectDetails.name : '';
    
    const majorLower = (userMajor || '').toLowerCase().trim();
    const codeLower = subjectCode.toLowerCase().trim();
    const nameLower = subjectName.toLowerCase().trim();
    
    let isMajor = false;
    if (majorLower && codeLower && nameLower) {
      if (
        codeLower.includes(majorLower) || majorLower.includes(codeLower) ||
        nameLower.includes(majorLower) || majorLower.includes(nameLower)
      ) {
        isMajor = true;
      }
    }
    
    if (isMajor) {
      majorUnits += units;
      if (isUpperDiv) upperDivUnits += units;
    } else {
      geUnits += units;
      if (isUpperDiv) upperDivUnits += units;
    }
  });

  const geReq = 47;
  const majorReq = 92;
  const upperDivReq = 60;
  const totalReq = 180;

  const gePercent = Math.min(100, Math.round((geUnits / geReq) * 100));
  const majorPercent = Math.min(100, Math.round((majorUnits / majorReq) * 100));
  const upperDivPercent = Math.min(100, Math.round((upperDivUnits / upperDivReq) * 100));
  const totalPercent = Math.min(100, Math.round((totalUnits / totalReq) * 100));

  return (
    <div className="degree-projection">
      <div className="projection-header">
        <h2>Degree Progress Projection</h2>
        <div className="projection-warning">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l7 14H1L8 1z" fill="#ff9800"/>
            <text x="8" y="11" textAnchor="middle" fill="white" fontSize="10">!</text>
          </svg>
          <span>This estimate is based on your plan and may differ from official records</span>
        </div>
      </div>
      <div className="projection-bars">
        <div className="projection-item">
          <div className="projection-label">General Education</div>
          <div className="projection-bar">
            <div className="projection-fill orange" style={{ width: `${gePercent}%` }}></div>
          </div>
          <div className="projection-value">{geUnits}/{geReq} Units</div>
        </div>
        <div className="projection-item">
          <div className="projection-label">Major</div>
          <div className="projection-bar">
            <div className="projection-fill green" style={{ width: `${majorPercent}%` }}></div>
          </div>
          <div className="projection-value">{majorUnits}/{majorReq} Units</div>
        </div>
        <div className="projection-item">
          <div className="projection-label">Upper Division</div>
          <div className="projection-bar">
            <div className="projection-fill purple" style={{ width: `${upperDivPercent}%` }}></div>
          </div>
          <div className="projection-value">{upperDivUnits}/{upperDivReq} Units</div>
        </div>
        <div className="projection-item">
          <div className="projection-label">180 Units</div>
          <div className="projection-bar">
            <div className="projection-fill blue" style={{ width: `${totalPercent}%` }}></div>
          </div>
          <div className="projection-value">{totalUnits}/{totalReq} Units</div>
        </div>
      </div>
    </div>
  );
}

export default DegreeProgress;
