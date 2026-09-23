import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, BrainCircuit, Users, Award, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import GlobalBrandLogo from '../../components/shared/GlobalBrandLogo';
import { getResolvedBrandLogo } from '../../constants/brandAssets';

export default function Home() {
  const { settings, frontendSettings } = useSettingsStore();
  const defaultDays = settings?.defaultAccessDays || 7;
  const primaryColor = frontendSettings?.primaryColor || 'purple';
  const superAdminUploadedLogo = getResolvedBrandLogo(frontendSettings?.heroLogo);

  return (
    <div className="flex-grow flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white pt-24 pb-32 overflow-hidden border-b border-zinc-100">
        {/* Background Logo Watermark - Only displayed if Super Admin uploaded a logo */}
        {superAdminUploadedLogo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none overflow-hidden z-0">
            <img 
              src={superAdminUploadedLogo} 
              alt="" 
              className="w-[120%] sm:w-[80%] lg:w-[60%] h-auto object-contain grayscale" 
            />
          </div>
        )}

        <div className="absolute inset-0 grid grid-cols-12 opacity-[0.03] pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="border-r border-black h-full" />
          ))}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {superAdminUploadedLogo && (
            <div className="mb-8 flex justify-center">
              <GlobalBrandLogo 
                id="hero-centerpiece-logo"
                imgId="hero-centerpiece-logo-img"
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl shadow-md p-1 bg-white border border-zinc-100"
                imageClassName="w-full h-full object-contain"
                variant="public"
              />
            </div>
          )}
          
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-red-600"></span>
            <span>Registration for {settings?.siteTitle || 'Medcore Academy'} is {settings?.allowRegistrations ? 'Open' : 'Closed'}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
            {frontendSettings?.heroHeading || 'Accelerate Your Medical Career'}
          </h1>
          
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {frontendSettings?.heroSubheading || 'Join thousands of medical students passing their exams with our precision-engineered mock tests and comprehensive study materials.'}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className={`inline-flex justify-center items-center px-8 py-4 text-base font-medium rounded-xl text-white bg-${primaryColor}-600 hover:bg-${primaryColor}-700 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto group`}
            >
              {frontendSettings?.heroButtonText || 'Start Your Free Trial'}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/courses" 
              className="inline-flex justify-center items-center px-8 py-4 text-base font-medium rounded-xl text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all w-full sm:w-auto"
            >
              Explore Curriculum
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-4">{frontendSettings?.featuresHeading || 'Everything you need to excel'}</h2>
            <p className="text-lg text-zinc-600">{frontendSettings?.featuresSubheading || 'Our platform is designed specifically for medical students, providing tools that actually improve retention and scores.'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Premium Video Courses</h3>
              <p className="text-zinc-500 leading-relaxed">
                High-quality video lectures covering anatomy, physiology, pharmacology, and clinical skills with progress tracking.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center mb-6">
                <BrainCircuit className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Advanced Quiz Engine</h3>
              <p className="text-zinc-500 leading-relaxed">
                Test your knowledge with timed MCQs, randomized questions, and detailed explanations to reinforce learning.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-zinc-900" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Active Community</h3>
              <p className="text-zinc-500 leading-relaxed">
                Connect with peers, participate in clinical discussions, and collaborate in real-time study groups.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonial / Social Proof */}
      <section className="py-24 bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-zinc-900 rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
              <Award className="h-64 w-64 text-white" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Join thousands of successful medical students.</h2>
              <div className="flex flex-col space-y-4 mb-10 text-zinc-300">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500" />
                  <span>Unique Trackable Student IDs</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500" />
                  <span>Automated CGPA Calculator</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500" />
                  <span>Flexible Medcore Coin Access Packages</span>
                </div>
              </div>
              <Link to="/register" className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-zinc-900 bg-white hover:bg-zinc-100 transition-colors">
                Create Your Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
