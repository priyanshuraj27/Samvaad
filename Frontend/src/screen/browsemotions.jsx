import React, { useState, useMemo, Fragment } from 'react';
import { Search, Zap, BookCopy, Shuffle, X, ChevronDown, Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
export default function App() {
    const MockRouter = ({ children }) => {
        const navigate = (path, options) => {
            console.log(`Navigating to ${path}`, options || '');
        };
        const NavigationContext = React.createContext(null);
        return <NavigationContext.Provider value={{ navigate }}>{children}</NavigationContext.Provider>;
    };
    return (
        <MockRouter>
            <BrowseMotions />
        </MockRouter>
    );
}

const allMotions = [
    { id: 1, text: "This house would implement a universal basic income.", category: 'Economics', difficulty: 'Intermediate' },
    { id: 2, text: "This house believes that artificial intelligence poses an existential threat to humanity.", category: 'Technology & AI', difficulty: 'Advanced' },
    { id: 3, text: "This house would ban single-use plastics.", category: 'Environment', difficulty: 'Beginner' },
    { id: 4, text: "This house regrets the rise of social media influencers.", category: 'Pop Culture & Arts', difficulty: 'Intermediate' },
    { id: 5, text: "This house believes that space exploration is a waste of resources.", category: 'Technology & AI', difficulty: 'Intermediate' },
    { id: 6, text: "This house would abolish the electoral college system.", category: 'Politics & Governance', difficulty: 'Advanced' },
    { id: 7, text: "This house would make voting mandatory.", category: 'Politics & Governance', difficulty: 'Beginner' },
    { id: 8, text: "This house believes that corporate lobbying should be illegal.", category: 'Politics & Governance', difficulty: 'Intermediate' },
    { id: 9, text: "This house would prioritize economic growth over environmental protection.", category: 'Economics', difficulty: 'Advanced' },
    { id: 10, text: "This house believes that gene editing for non-medical purposes is unethical.", category: 'Ethics & Philosophy', difficulty: 'Advanced' },
    { id: 11, text: "This house would require all students to learn a musical instrument.", category: 'Education', difficulty: 'Beginner' },
    { id: 12, text: "This house supports a global wealth tax.", category: 'Economics', difficulty: 'Advanced' },
    { id: 13, text: "This house believes that public funding for the arts is essential.", category: 'Pop Culture & Arts', difficulty: 'Beginner' },
    { id: 14, text: "This house would replace traditional exams with project-based assessments.", category: 'Education', difficulty: 'Intermediate' },
    { id: 15, text: "This house regrets the commercialization of pride parades.", category: 'Social Issues', difficulty: 'Intermediate' },
    { id: 16, text: "This house believes that nuclear energy is the most viable solution to climate change.", category: 'Environment', difficulty: 'Advanced' },
    { id: 17, text: "This house would hold social media platforms legally liable for misinformation.", category: 'Technology & AI', difficulty: 'Advanced' },
    { id: 18, text: "This house believes that a vegetarian diet is morally obligatory.", category: 'Ethics & Philosophy', difficulty: 'Intermediate' },
    { id: 19, text: "This house would significantly restrict intellectual property rights.", category: 'Economics', difficulty: 'Advanced' },
    { id: 20, text: "This house supports the right to be forgotten online.", category: 'Technology & AI', difficulty: 'Intermediate' },
    { id: 21, text: "This house would implement term limits for all elected officials.", category: 'Politics & Governance', difficulty: 'Intermediate' },
    { id: 22, text: "This house believes that standardized testing is a necessary evil.", category: 'Education', difficulty: 'Intermediate' },
    { id: 23, text: "This house would ban all forms of private healthcare.", category: 'Social Issues', difficulty: 'Advanced' },
    { id: 24, text: "This house believes that zoos do more harm than good.", category: 'Environment', difficulty: 'Beginner' },
    { id: 25, text: "This house would break up major tech companies.", category: 'Technology & AI', difficulty: 'Advanced' },
    { id: 26, text: "This house believes that free will is an illusion.", category: 'Ethics & Philosophy', difficulty: 'Advanced' },
    { id: 27, text: "This house would make all public transportation free.", category: 'Economics', difficulty: 'Intermediate' },
    { id: 28, text: "This house regrets the decline of traditional journalism.", category: 'Pop Culture & Arts', difficulty: 'Intermediate' },
    { id: 29, text: "This house would require mandatory national service for all 18-year-olds.", category: 'Social Issues', difficulty: 'Intermediate' },
    { id: 30, text: "This house would allow citizens to sell their votes.", category: 'Politics & Governance', difficulty: 'Advanced' },
];
const categories = ['All', 'Technology & AI', 'Politics & Governance', 'Economics', 'Ethics & Philosophy', 'Environment', 'Education', 'Pop Culture & Arts', 'Social Issues'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

// --- REUSABLE COMPONENTS ---
const FilterDropdown = ({ options, selected, setSelected, label }) => (
    <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button className="inline-flex w-full justify-between items-center rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900">
            {selected === 'All' ? label : selected}
            <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </Menu.Button>
        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-700">
                <div className="py-1">
                    {options.map(option => (
                        <Menu.Item key={option}>
                            {({ active }) => (
                                <button onClick={() => setSelected(option)} className={`${active ? 'bg-slate-700 text-white' : 'text-slate-300'} ${selected === option ? 'font-bold' : 'font-normal'} group flex w-full items-center rounded-md px-4 py-2 text-sm text-left`}>
                                    {selected === option && <Check className="w-4 h-4 mr-2 text-green-400" />}
                                    {option}
                                </button>
                            )}
                        </Menu.Item>
                    ))}
                </div>
            </Menu.Items>
        </Transition>
    </Menu>
);
const BrowseMotions = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeDifficulty, setActiveDifficulty] = useState('All');
    const [randomMotion, setRandomMotion] = useState(null);
    const navigate = useNavigate();

    const filteredMotions = useMemo(() => {
        return allMotions.filter(motion => {
            const searchMatch = motion.text.toLowerCase().includes(searchQuery.toLowerCase());
            const categoryMatch = activeCategory === 'All' || motion.category === activeCategory;
            const difficultyMatch = activeDifficulty === 'All' || motion.difficulty === activeDifficulty;
            return searchMatch && categoryMatch && difficultyMatch;
        });
    }, [searchQuery, activeCategory, activeDifficulty]);

    const handleRandomMotion = () => {
        if (filteredMotions.length > 0) {
            const randomIndex = Math.floor(Math.random() * filteredMotions.length);
            setRandomMotion(filteredMotions[randomIndex]);
        }
    };

    const handleDebate = (motionText) => {
        navigate('/debate/1v1', { state: { motion: motionText } });
    };

    const handleExplorePack = () => {
        setActiveCategory('Technology & AI');
        setActiveDifficulty('Advanced');
    };

    return (
        <div className="bg-slate-900 text-white min-h-screen font-sans">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors">
                        <ArrowLeft size={16} />
                        Back
                    </button>
                </div>

                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Motion Library</h1>
                    <p className="text-slate-400 mt-3 max-w-2xl mx-auto">Explore topics, challenge your perspective, and prepare for your next victory.</p>
                </div>
                
                <div className="mb-12">
                    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-green-900/40 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center shadow-2xl border border-slate-700/50">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-green-400">Featured Pack</h2>
                            <p className="text-2xl font-bold mt-1 text-white">Advanced AI & Ethics</p>
                            <p className="text-slate-300 mt-2 max-w-md">Dive into complex questions about the future of artificial intelligence.</p>
                        </div>
                        <button onClick={handleExplorePack} className="mt-6 md:mt-0 w-full md:w-auto bg-green-500 text-black font-bold py-3 px-6 rounded-lg hover:bg-green-400 transition-colors flex items-center justify-center gap-2 transform hover:scale-105">
                            Explore Pack <ChevronRight className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="relative md:col-span-6">
                            <label htmlFor="search-motions" className="block text-sm font-medium text-slate-400 mb-1">Search Motions</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input id="search-motions" type="text" placeholder="Search for keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-slate-400 mb-1">Difficulty</label>
                            <FilterDropdown options={difficulties} selected={activeDifficulty} setSelected={setActiveDifficulty} label="Any Difficulty" />
                        </div>
                        <button onClick={handleRandomMotion} className="md:col-span-2 w-full bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-600 transition-colors border border-slate-600">
                            <Shuffle className="w-5 h-5 text-green-400" />
                            Random
                        </button>
                    </div>
                     <div className="mt-4 border-t border-slate-700 pt-4">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(category => (
                                <button key={category} onClick={() => setActiveCategory(category)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${activeCategory === category ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filteredMotions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMotions.map(motion => (
                            <div key={motion.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col shadow-lg hover:border-green-500/50 hover:-translate-y-1 transition-all duration-300 group">
                                <p className="text-slate-200 text-lg flex-grow mb-4">{motion.text}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                        motion.difficulty === 'Beginner' ? 'bg-green-900/50 text-green-300' :
                                        motion.difficulty === 'Intermediate' ? 'bg-yellow-900/50 text-yellow-300' :
                                        'bg-red-900/50 text-red-300'
                                    }`}>{motion.difficulty}</span>
                                    <button onClick={() => handleDebate(motion.text)} className="font-semibold text-green-400 hover:text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Debate <Zap className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <BookCopy className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300">No Motions Found</h3>
                        <p className="text-slate-500 mt-1">Please adjust your search or filters.</p>
                    </div>
                )}

                {randomMotion && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative border border-slate-700">
                            <button onClick={() => setRandomMotion(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            <h2 className="text-2xl font-bold text-white mb-2">Random Motion</h2>
                            <p className="text-slate-400 mb-6">Here's a topic for you to tackle:</p>
                            <div className="bg-slate-900/70 p-6 rounded-lg border border-slate-700 mb-8">
                                <p className="text-lg text-slate-200">{randomMotion.text}</p>
                            </div>
                            <button onClick={() => handleDebate(randomMotion.text)} className="w-full bg-green-600 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-500 transition-colors text-lg">
                                <Zap className="w-5 h-5" /> Debate This Motion
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
