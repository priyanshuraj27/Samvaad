import React, { useState, useMemo, Fragment } from 'react';
import { Search, Zap, BookCopy, Shuffle, X, ChevronDown, Check, ChevronRight } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';

// Mock data for motions. In a real app, this would come from an API.
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

// Custom Dropdown Component for Filters (Dark Theme)
const FilterDropdown = ({ options, selected, setSelected }) => (
    <Menu as="div" className="relative inline-block text-left w-full">
        <div>
            <Menu.Button className="inline-flex w-full justify-between items-center rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                {selected}
                <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
            </Menu.Button>
        </div>
        <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
                <div className="py-1">
                    {options.map(option => (
                        <Menu.Item key={option}>
                            {({ active }) => (
                                <button onClick={() => setSelected(option)} className={`${active ? 'bg-gray-700 text-white' : 'text-gray-300'} ${selected === option ? 'font-bold' : 'font-normal'} group flex w-full items-center rounded-md px-4 py-2 text-sm text-left`}>
                                    {selected === option && <Check className="w-4 h-4 mr-2 text-purple-400" />}
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

// Main Browse Motions Screen Component
const BrowseMotions = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeDifficulty, setActiveDifficulty] = useState('All');
    const [randomMotion, setRandomMotion] = useState(null);

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

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Motion Library</h1>
                    <p className="text-gray-400 mt-3 max-w-2xl mx-auto">Explore topics, challenge your perspective, and prepare for your next victory.</p>
                </div>
                
                {/* Featured Pack */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center shadow-2xl border border-gray-700/50">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400">Featured Pack</h2>
                            <p className="text-2xl font-bold mt-1">Advanced AI & Ethics</p>
                            <p className="text-gray-300 mt-2 max-w-md">Dive into complex questions about the future of artificial intelligence and its impact on society.</p>
                        </div>
                        <button className="mt-6 md:mt-0 w-full md:w-auto bg-white text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                            Explore Pack <ChevronRight className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Filters and Search Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8">
                    <div className="relative md:col-span-1">
                         <label htmlFor="search-motions" className="block text-sm font-medium text-gray-400 mb-1">Search</label>
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                           <input id="search-motions" type="text" placeholder="Search motions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:col-span-1">
                        <div>
                           <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                           <FilterDropdown options={categories} selected={activeCategory} setSelected={setActiveCategory} />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
                           <FilterDropdown options={difficulties} selected={activeDifficulty} setSelected={setActiveDifficulty} />
                        </div>
                    </div>
                    <button onClick={handleRandomMotion} className="w-full md:w-auto justify-self-start md:justify-self-end bg-gray-700 text-gray-200 font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors border border-gray-600 h-10">
                        <Shuffle className="w-5 h-5 text-purple-400" />
                        Random Motion
                    </button>
                </div>

                {/* Motion List */}
                {filteredMotions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMotions.map(motion => (
                            <div key={motion.id} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 flex flex-col shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300">
                                <p className="text-gray-200 text-lg flex-grow mb-4">{motion.text}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex gap-2">
                                        <span className="text-xs font-semibold bg-purple-900/50 text-purple-300 px-2.5 py-1 rounded-full">{motion.difficulty}</span>
                                    </div>
                                    <button className="font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                        Debate <Zap className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                        <BookCopy className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300">No Motions Found</h3>
                        <p className="text-gray-500 mt-1">Please adjust your search or filters.</p>
                    </div>
                )}

                {/* Random Motion Modal */}
                {randomMotion && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in-up border border-gray-700">
                            <button onClick={() => setRandomMotion(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-2">Random Motion</h2>
                            <p className="text-gray-400 mb-6">Here's a topic for you to tackle:</p>
                            <div className="bg-gray-900/70 p-6 rounded-lg border border-gray-700 mb-8">
                                <p className="text-lg text-gray-200">{randomMotion.text}</p>
                            </div>
                            <button className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors text-lg">
                                <Zap className="w-5 h-5" />
                                Debate This Motion
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseMotions;

