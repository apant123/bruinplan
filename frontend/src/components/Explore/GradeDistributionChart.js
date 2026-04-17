import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_BASE } from '../../api/constants';
import './GradeDistributionChart.css';

const GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'NP', 'I'];

function GradeDistributionChart({ courseId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTerm, setSelectedTerm] = useState('All');
  const [selectedInstructor, setSelectedInstructor] = useState('All');

  useEffect(() => {
    async function fetchGrades() {
      try {
        const res = await fetch(`${API_BASE}/api/courses/${courseId}/grades/`);
        if (res.ok) {
          const json = await res.json();
          setData(json.grades || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, [courseId]);

  const terms = useMemo(() => {
    let filtered = data;
    if (selectedInstructor !== 'All') {
      filtered = data.filter(d => d.instructor === selectedInstructor);
    }
    const t = new Set(filtered.map(d => d.term));
    return ['All', ...Array.from(t)];
  }, [data, selectedInstructor]);

  const instructors = useMemo(() => {
    let filtered = data;
    if (selectedTerm !== 'All') {
      filtered = data.filter(d => d.term === selectedTerm);
    }
    const inst = new Set(filtered.map(d => d.instructor));
    return ['All', ...Array.from(inst)];
  }, [data, selectedTerm]);

  // Reset instructor to 'All' if selected term changes and instructor isn't valid anymore
  useEffect(() => {
    if (selectedInstructor !== 'All' && !instructors.includes(selectedInstructor)) {
      setSelectedInstructor('All');
    }
  }, [selectedInstructor, instructors]);

  // Reset term to 'All' if selected instructor changes and term isn't valid anymore
  useEffect(() => {
    if (selectedTerm !== 'All' && !terms.includes(selectedTerm)) {
      setSelectedTerm('All');
    }
  }, [selectedTerm, terms]);

  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    let filtered = data;
    if (selectedTerm !== 'All') filtered = filtered.filter(d => d.term === selectedTerm);
    if (selectedInstructor !== 'All') filtered = filtered.filter(d => d.instructor === selectedInstructor);

    const aggregatedGrades = {};
    let totalGrades = 0;

    filtered.forEach(item => {
      const gJson = item.grades_json || {};
      Object.keys(gJson).forEach(grade => {
        aggregatedGrades[grade] = (aggregatedGrades[grade] || 0) + gJson[grade];
        totalGrades += gJson[grade];
      });
    });

    if (totalGrades === 0) return [];

    let finalData = [];
    Object.keys(aggregatedGrades).forEach(grade => {
      finalData.push({
        grade: grade,
        count: aggregatedGrades[grade],
        percentage: (aggregatedGrades[grade] / totalGrades) * 100
      });
    });

    // Sort according to GRADE_ORDER
    finalData.sort((a, b) => {
      let idxA = GRADE_ORDER.indexOf(a.grade);
      let idxB = GRADE_ORDER.indexOf(b.grade);
      if(idxA === -1) idxA = 999;
      if(idxB === -1) idxB = 999;
      return idxA - idxB;
    });

    return finalData;
  }, [data, selectedTerm, selectedInstructor]);

  if (loading) return <div className="grades-loading">Loading grade distributions...</div>;
  if (!data.length) return <div className="grades-empty">No grade data available for this course.</div>;

  return (
    <div className="grade-distribution-container">
      <div className="grade-filters">
        <div className="filter-group">
          <label>Term:</label>
          <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
            {terms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Instructor:</label>
          <select value={selectedInstructor} onChange={(e) => setSelectedInstructor(e.target.value)}>
            {instructors.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
              <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 13}} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#666', fontSize: 13}}
                tickFormatter={(val) => `${val.toFixed(1)}%`}
              />
              <Tooltip 
                cursor={{fill: '#f4f4f4'}}
                formatter={(value, name, props) => [`${value.toFixed(1)}% (${props.payload.count} students)`, 'Percentage']}
              />
              <Bar dataKey="percentage" fill="#b0cde2" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grades-empty">No grade data matches the selected filters.</div>
      )}
    </div>
  );
}

export default GradeDistributionChart;
