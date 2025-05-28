import React, { useState, useEffect } from 'react';
import { useGlobalListStateFlow, useListItem } from '../src/useListStateFlow';
import { StorageType } from '../src/GlobalStateFlow';
import './LargeListStateFlowExample.css';

// Define a record type with multiple fields
interface Record {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  category: string;
  priority: number;
  tags: string[];
  metadata: {
    views: number;
    lastAccessed: string;
  };
}

/**
 * Generate a large dataset of records
 */
function generateLargeDataset(count: number): Record[] {
  const records: Record[] = [];
  const categories = ['work', 'personal', 'urgent', 'archived', 'draft'];
  const statuses: ['active', 'inactive'] = ['active', 'inactive'];
  
  for (let i = 1; i <= count; i++) {
    records.push({
      id: i,
      name: `Record ${i}`,
      email: `user${i}@example.com`,
      status: statuses[i % 2],
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      category: categories[i % categories.length],
      priority: (i % 5) + 1,
      tags: [`tag-${i % 10}`, `priority-${(i % 5) + 1}`],
      metadata: {
        views: i * 10,
        lastAccessed: new Date(Date.now() - i * 3600000).toISOString()
      }
    });
  }
  
  return records;
}

/**
 * Individual record item component that subscribes to its own updates
 */
const RecordItem: React.FC<{
  recordId: number;
  listFlow: any;
  onSelect: (id: number) => void;
}> = ({ recordId, listFlow, onSelect }) => {
  // Use the individual item hook to subscribe only to this record's changes
  const [record, updateRecord] = useListItem(listFlow, recordId);
  
  if (!record) return null;
  
  return (
    <div 
      className={`record-item ${record.status === 'inactive' ? 'inactive' : ''}`}
      onClick={() => onSelect(record.id)}
    >
      <div className="record-header">
        <span className="record-id">#{record.id}</span>
        <span className={`record-status status-${record.status}`}>
          {record.status}
        </span>
      </div>
      <div className="record-name">{record.name}</div>
      <div className="record-category">{record.category}</div>
      <div className="record-priority">Priority: {record.priority}</div>
      <div className="record-views">Views: {record.metadata.views}</div>
      <div className="record-tags">
        {record.tags.map(tag => (
          <span key={tag} className="record-tag">{tag}</span>
        ))}
      </div>
      
      {/* Quick action buttons that update only this record */}
      <div className="record-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateRecord(r => ({
              ...r,
              priority: Math.min(5, r.priority + 1),
              updatedAt: new Date().toISOString()
            }));
          }}
        >
          ↑ Priority
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateRecord(r => ({
              ...r,
              status: r.status === 'active' ? 'inactive' : 'active',
              updatedAt: new Date().toISOString()
            }));
          }}
        >
          Toggle Status
        </button>
      </div>
    </div>
  );
};

/**
 * Example component demonstrating ListStateFlow with a large dataset
 */
const LargeListStateFlowExample: React.FC = () => {
  // Number of records to generate
  const recordCount = 1000;
  
  // Use ListStateFlow with persistence to IndexedDB
  const [records, listFlow] = useGlobalListStateFlow<Record>(
    'largeRecordsList',
    generateLargeDataset(recordCount),
    {
      idField: 'id',
      persistOptions: {
        enabled: true,
        storageType: StorageType.INDEXED_DB,
        dbName: 'large-lists-db',
        storeName: 'records-store',
        debounceTime: 500
      }
    }
  );
  
  // State for filtering and pagination
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const recordsPerPage = 20;
  
  // Apply filters
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(filter.toLowerCase()) ||
                         record.email.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Paginate
  const paginatedRecords = filteredRecords.slice(
    (page - 1) * recordsPerPage,
    page * recordsPerPage
  );
  
  // Get unique categories for filter dropdown
  const categories = ['all', ...new Set(records.map(r => r.category))];
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filter, categoryFilter, statusFilter]);
  
  // Batch update functionality
  const batchUpdatePriorities = () => {
    const updates = filteredRecords.map(record => ({
      id: record.id,
      update: (r: Record) => ({
        ...r,
        priority: Math.min(5, r.priority + 1),
        updatedAt: new Date().toISOString()
      })
    }));
    
    listFlow.batchUpdate(updates);
  };
  
  return (
    <div className="large-list-example">
      <h2>Large List StateFlow Example</h2>
      <p className="description">
        This example demonstrates how to efficiently manage a large list of records (1000 items with 10 fields each)
        using ListStateFlow. Each record can be updated individually without re-rendering the entire list.
      </p>
      
      <div className="controls">
        <div className="filters">
          <input
            type="text"
            placeholder="Search by name or email"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="category-filter"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div className="batch-actions">
          <button onClick={batchUpdatePriorities} className="batch-button">
            Increase Priority for All Filtered Records
          </button>
          
          <button 
            onClick={() => {
              const newId = Math.max(...records.map(r => r.id)) + 1;
              listFlow.addItem({
                id: newId,
                name: `New Record ${newId}`,
                email: `new${newId}@example.com`,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                category: 'draft',
                priority: 3,
                tags: ['new', 'draft'],
                metadata: {
                  views: 0,
                  lastAccessed: new Date().toISOString()
                }
              });
            }}
            className="add-button"
          >
            Add New Record
          </button>
        </div>
      </div>
      
      <div className="list-container">
        <div className="records-list">
          <div className="records-header">
            <span>Showing {paginatedRecords.length} of {filteredRecords.length} records</span>
          </div>
          
          <div className="records-grid">
            {paginatedRecords.map(record => (
              <RecordItem 
                key={record.id}
                recordId={record.id}
                listFlow={listFlow}
                onSelect={(id) => setSelectedRecord(listFlow.getItem(id))}
              />
            ))}
          </div>
          
          <div className="pagination">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page} of {Math.ceil(filteredRecords.length / recordsPerPage)}</span>
            <button 
              onClick={() => setPage(p => Math.min(Math.ceil(filteredRecords.length / recordsPerPage), p + 1))}
              disabled={page >= Math.ceil(filteredRecords.length / recordsPerPage)}
            >
              Next
            </button>
          </div>
        </div>
        
        {selectedRecord && (
          <div className="record-detail">
            <h3>Record Details</h3>
            <button 
              className="close-button"
              onClick={() => setSelectedRecord(null)}
            >
              ×
            </button>
            
            <div className="detail-content">
              <div className="detail-field">
                <label>ID:</label>
                <span>{selectedRecord.id}</span>
              </div>
              
              <div className="detail-field">
                <label>Name:</label>
                <input 
                  type="text"
                  value={selectedRecord.name}
                  onChange={(e) => {
                    listFlow.updateItem(selectedRecord.id, r => ({
                      ...r,
                      name: e.target.value,
                      updatedAt: new Date().toISOString()
                    }));
                    setSelectedRecord({
                      ...selectedRecord,
                      name: e.target.value,
                      updatedAt: new Date().toISOString()
                    });
                  }}
                />
              </div>
              
              <div className="detail-field">
                <label>Email:</label>
                <input 
                  type="email"
                  value={selectedRecord.email}
                  onChange={(e) => {
                    listFlow.updateItem(selectedRecord.id, r => ({
                      ...r,
                      email: e.target.value,
                      updatedAt: new Date().toISOString()
                    }));
                    setSelectedRecord({
                      ...selectedRecord,
                      email: e.target.value,
                      updatedAt: new Date().toISOString()
                    });
                  }}
                />
              </div>
              
              <div className="detail-field">
                <label>Status:</label>
                <select
                  value={selectedRecord.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as 'active' | 'inactive';
                    listFlow.updateItem(selectedRecord.id, r => ({
                      ...r,
                      status: newStatus,
                      updatedAt: new Date().toISOString()
                    }));
                    setSelectedRecord({
                      ...selectedRecord,
                      status: newStatus,
                      updatedAt: new Date().toISOString()
                    });
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="detail-field">
                <label>Category:</label>
                <select
                  value={selectedRecord.category}
                  onChange={(e) => {
                    listFlow.updateItem(selectedRecord.id, r => ({
                      ...r,
                      category: e.target.value,
                      updatedAt: new Date().toISOString()
                    }));
                    setSelectedRecord({
                      ...selectedRecord,
                      category: e.target.value,
                      updatedAt: new Date().toISOString()
                    });
                  }}
                >
                  {categories.filter(c => c !== 'all').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="detail-field">
                <label>Priority:</label>
                <input 
                  type="range"
                  min="1"
                  max="5"
                  value={selectedRecord.priority}
                  onChange={(e) => {
                    const newPriority = parseInt(e.target.value);
                    listFlow.updateItem(selectedRecord.id, r => ({
                      ...r,
                      priority: newPriority,
                      updatedAt: new Date().toISOString()
                    }));
                    setSelectedRecord({
                      ...selectedRecord,
                      priority: newPriority,
                      updatedAt: new Date().toISOString()
                    });
                  }}
                />
                <span>{selectedRecord.priority}</span>
              </div>
              
              <div className="detail-field">
                <label>Tags:</label>
                <div className="tags-editor">
                  {selectedRecord.tags.map((tag, index) => (
                    <div key={index} className="tag-item">
                      <span>{tag}</span>
                      <button
                        onClick={() => {
                          const newTags = selectedRecord.tags.filter((_, i) => i !== index);
                          listFlow.updateItem(selectedRecord.id, r => ({
                            ...r,
                            tags: newTags,
                            updatedAt: new Date().toISOString()
                          }));
                          setSelectedRecord({
                            ...selectedRecord,
                            tags: newTags,
                            updatedAt: new Date().toISOString()
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newTag = e.currentTarget.value.trim();
                        const newTags = [...selectedRecord.tags, newTag];
                        listFlow.updateItem(selectedRecord.id, r => ({
                          ...r,
                          tags: newTags,
                          updatedAt: new Date().toISOString()
                        }));
                        setSelectedRecord({
                          ...selectedRecord,
                          tags: newTags,
                          updatedAt: new Date().toISOString()
                        });
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="detail-field">
                <label>Views:</label>
                <input 
                  type="number"
                  value={selectedRecord.metadata.views}
                  onChange={(e) => {
                    const newViews = parseInt(e.target.value) || 0;
                    listFlow.updateItem(selectedRecord.id, r => ({
                      ...r,
                      metadata: {
                        ...r.metadata,
                        views: newViews
                      },
                      updatedAt: new Date().toISOString()
                    }));
                    setSelectedRecord({
                      ...selectedRecord,
                      metadata: {
                        ...selectedRecord.metadata,
                        views: newViews
                      },
                      updatedAt: new Date().toISOString()
                    });
                  }}
                />
              </div>
              
              <div className="detail-field">
                <label>Created:</label>
                <span>{new Date(selectedRecord.createdAt).toLocaleString()}</span>
              </div>
              
              <div className="detail-field">
                <label>Updated:</label>
                <span>{new Date(selectedRecord.updatedAt).toLocaleString()}</span>
              </div>
              
              <div className="detail-actions">
                <button
                  className="delete-button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete record #${selectedRecord.id}?`)) {
                      listFlow.removeItem(selectedRecord.id);
                      setSelectedRecord(null);
                    }
                  }}
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="explanation">
        <h3>How It Works</h3>
        <ol>
          <li>Each record has its own StateFlow instance, allowing individual updates without affecting other items</li>
          <li>The main list has a StateFlow that manages the overall collection</li>
          <li>Updates to individual items are propagated to both the item's flow and the main list flow</li>
          <li>Components subscribe only to the items they display, minimizing re-renders</li>
          <li>Batch operations are optimized to minimize updates and re-renders</li>
          <li>All data is persisted to IndexedDB asynchronously with debouncing</li>
          <li>Memory usage is optimized by reusing connections and cleaning up resources</li>
        </ol>
        
        <h4>Performance Benefits</h4>
        <ul>
          <li><strong>Granular Updates:</strong> Only affected components re-render when an item changes</li>
          <li><strong>Efficient Persistence:</strong> Changes are saved to IndexedDB with debouncing</li>
          <li><strong>Optimized Rendering:</strong> List virtualization prevents rendering all 1000 items at once</li>
          <li><strong>Memory Efficiency:</strong> Resources are properly managed to prevent memory leaks</li>
        </ul>
      </div>
    </div>
  );
};

export default LargeListStateFlowExample;
