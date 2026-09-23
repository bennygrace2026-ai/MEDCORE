import { useState } from 'react';
import { Calculator, Plus, Trash2, RefreshCw } from 'lucide-react';

interface CourseEntry {
  id: string;
  courseCode: string;
  units: number;
  grade: string;
}

const gradePoints: Record<string, number> = {
  'A': 5,
  'B': 4,
  'C': 3,
  'D': 2,
  'E': 1,
  'F': 0
};

export default function GPCalculator() {
  const [courses, setCourses] = useState<CourseEntry[]>([
    { id: '1', courseCode: '', units: 3, grade: 'A' },
    { id: '2', courseCode: '', units: 2, grade: 'B' },
    { id: '3', courseCode: '', units: 2, grade: 'C' }
  ]);

  const addCourse = () => {
    setCourses([...courses, { id: Date.now().toString(), courseCode: '', units: 2, grade: 'A' }]);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: string | number) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const resetCalculator = () => {
    setCourses([
      { id: '1', courseCode: '', units: 3, grade: 'A' },
      { id: '2', courseCode: '', units: 2, grade: 'B' },
      { id: '3', courseCode: '', units: 2, grade: 'C' }
    ]);
  };

  // Calculate GP
  let totalUnits = 0;
  let totalPoints = 0;

  courses.forEach(course => {
    if (course.units > 0 && course.grade) {
      totalUnits += course.units;
      totalPoints += course.units * gradePoints[course.grade];
    }
  });

  const gpa = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : '0.00';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-zinc-200 bg-zinc-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-600 rounded-xl">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">GPA Calculator</h2>
              <p className="text-zinc-400">Calculate your Grade Point Average instantly</p>
            </div>
          </div>
          
          <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 min-w-[200px] text-center shadow-inner">
            <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">Your GPA</p>
            <p className="text-4xl font-black text-amber-500">{gpa}</p>
            <p className="text-xs text-zinc-500 mt-1">Total Units: {totalUnits}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="hidden sm:grid grid-cols-12 gap-4 mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wider px-2">
            <div className="col-span-5">Course Code (Optional)</div>
            <div className="col-span-3 text-center">Credit Units</div>
            <div className="col-span-3 text-center">Grade</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-4">
            {courses.map((course, index) => (
              <div key={course.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-zinc-50 p-4 sm:p-2 sm:bg-transparent rounded-lg border sm:border-none border-zinc-200">
                <div className="sm:col-span-5 flex flex-col sm:block">
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 sm:hidden">Course Code</label>
                  <input
                    type="text"
                    placeholder={`e.g. ANA ${201 + index}`}
                    value={course.courseCode}
                    onChange={(e) => updateCourse(course.id, 'courseCode', e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-colors"
                  />
                </div>
                
                <div className="sm:col-span-3 flex flex-col sm:block">
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 sm:hidden">Units</label>
                  <select
                    value={course.units}
                    onChange={(e) => updateCourse(course.id, 'units', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-colors text-center sm:text-left"
                  >
                    {[1, 2, 3, 4, 5, 6].map(u => (
                      <option key={u} value={u}>{u} {u === 1 ? 'Unit' : 'Units'}</option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:col-span-3 flex flex-col sm:block">
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 sm:hidden">Grade</label>
                  <select
                    value={course.grade}
                    onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-zinc-900 focus:border-zinc-900 outline-none transition-colors text-center sm:text-left font-bold"
                  >
                    <option value="A">A (70-100) - 5 Pts</option>
                    <option value="B">B (60-69) - 4 Pts</option>
                    <option value="C">C (50-59) - 3 Pts</option>
                    <option value="D">D (45-49) - 2 Pts</option>
                    <option value="E">E (40-44) - 1 Pt</option>
                    <option value="F">F (0-39) - 0 Pts</option>
                  </select>
                </div>
                
                <div className="sm:col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                  <button
                    onClick={() => removeCourse(course.id)}
                    disabled={courses.length <= 1}
                    className="p-2 text-zinc-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors bg-white sm:bg-transparent border border-zinc-200 sm:border-none rounded-lg"
                    title="Remove Course"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100 pt-6">
            <button
              onClick={addCourse}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-lg text-zinc-700 bg-white hover:bg-zinc-50 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4 text-zinc-500" />
              Add Another Course
            </button>
            
            <button
              onClick={resetCalculator}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Calculator
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start">
        <div className="mt-0.5 mr-3 flex-shrink-0">
          <Calculator className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900">Grading Scale (Nigerian Standard)</h4>
          <p className="text-sm text-amber-800 mt-1">
            This calculator uses the standard 5-point grading system where A=5, B=4, C=3, D=2, E=1, and F=0. Your GPA is automatically calculated as you update the fields.
          </p>
        </div>
      </div>
    </div>
  );
}
