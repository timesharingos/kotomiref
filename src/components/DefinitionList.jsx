import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

function DefinitionList() {
    const navigate = useNavigate()
    const [definitions, setDefinitions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadDefinitions()
    }, [])

    const loadDefinitions = async () => {
        try {
            setLoading(true)
            const data = await window.electronAPI.entity.getAllByType('definition')
            setDefinitions(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this definition?')) {
            return
        }

        try {
            const result = await window.electronAPI.entity.deleteDefinition(id)
            if (result.success) {
                loadDefinitions()
            } else {
                toast.error('Failed to delete definition: ' + result.error)
            }
        } catch (err) {
            toast.error('Failed to delete definition: ' + err.message)
        }
    }

    if (loading) {
        return <div className="loading">Loading...</div>
    }

    if (error) {
        return <div className="error-message">{error}</div>
    }

    return (
        <div className="list-container">
            <div className="list-header">
                <h2>Definitions</h2>
                <button onClick={() => navigate('/definitions/new')}>Add Definition</button>
            </div>

            {definitions.length === 0 ? (
                <div className="empty-state">No definitions found. Create your first definition!</div>
            ) : (
                <table className="entity-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Subject</th>
                            <th>Refine</th>
                            <th>Scenario</th>
                            <th>Evolution</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {definitions.map(definition => (
                            <tr key={definition.id}>
                                <td>{definition.name}</td>
                                <td className="description-cell">{definition.description}</td>
                                <td>{definition.subject?.name || '-'}</td>
                                <td>
                                    {definition.refines && definition.refines.length > 0
                                        ? definition.refines.map(r => r.name).join(', ')
                                        : '-'}
                                </td>
                                <td>
                                    {definition.scenarios && definition.scenarios.length > 0
                                        ? definition.scenarios.map(s => s.name).join(', ')
                                        : '-'}
                                </td>
                                <td>
                                    {definition.evolutions && definition.evolutions.length > 0
                                        ? definition.evolutions.map(e => e.name).join(', ')
                                        : '-'}
                                </td>
                                <td className="actions-cell">
                                    <button onClick={() => navigate(`/definitions/edit/${definition.id}`)}>
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(definition.id)} className="delete-btn">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default DefinitionList

