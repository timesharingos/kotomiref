import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EntitySelector from './EntitySelector'

function DefinitionForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = !!id

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        subjectId: '',
        aliasIds: [],
        parentIds: [],
        relationIds: [],
        refineIds: [],
        scenarioIds: [],
        evoIds: []
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (isEditMode) {
            loadDefinition()
        }
    }, [id])

    const loadDefinition = async () => {
        try {
            setLoading(true)
            const definitions = await window.electronAPI.entity.getAllByType('definition')
            const definition = definitions.find(d => d.id === id)
            
            if (definition) {
                setFormData({
                    name: definition.name || '',
                    description: definition.description || '',
                    subjectId: definition.subject?.id || '',
                    aliasIds: definition.aliases?.map(a => a.id) || [],
                    parentIds: definition.parents?.map(p => p.id) || [],
                    relationIds: definition.relations?.map(r => r.id) || [],
                    refineIds: definition.refines?.map(r => r.id) || [],
                    scenarioIds: definition.scenarios?.map(s => s.id) || [],
                    evoIds: definition.evolutions?.map(e => e.id) || []
                })
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const result = isEditMode
                ? await window.electronAPI.entity.updateDefinition({ id, ...formData })
                : await window.electronAPI.entity.addDefinition(formData)

            if (result.success) {
                navigate('/definitions')
            } else {
                setError(result.error || 'Failed to save definition')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (loading && isEditMode) {
        return <div className="loading">Loading...</div>
    }

    return (
        <div className="form-container">
            <h2>{isEditMode ? 'Edit Definition' : 'Add Definition'}</h2>
            
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label>Subject</label>
                    <EntitySelector
                        value={formData.subjectId}
                        onChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                        placeholder="Select subject..."
                    />
                </div>

                <div className="form-group">
                    <label>Aliases</label>
                    <EntitySelector
                        value={formData.aliasIds}
                        onChange={(value) => setFormData(prev => ({ ...prev, aliasIds: value }))}
                        multiple
                        placeholder="Select aliases..."
                    />
                </div>

                <div className="form-group">
                    <label>Parents</label>
                    <EntitySelector
                        value={formData.parentIds}
                        onChange={(value) => setFormData(prev => ({ ...prev, parentIds: value }))}
                        multiple
                        placeholder="Select parents..."
                    />
                </div>

                <div className="form-group">
                    <label>Relations</label>
                    <EntitySelector
                        value={formData.relationIds}
                        onChange={(value) => setFormData(prev => ({ ...prev, relationIds: value }))}
                        multiple
                        placeholder="Select relations..."
                    />
                </div>

                <div className="form-group">
                    <label>Refine (Problem)</label>
                    <EntitySelector
                        value={formData.refineIds}
                        onChange={(value) => setFormData(prev => ({ ...prev, refineIds: value }))}
                        multiple
                        entityType="problem"
                        placeholder="Select problems to refine..."
                    />
                </div>

                <div className="form-group">
                    <label>Scenario</label>
                    <EntitySelector
                        value={formData.scenarioIds}
                        onChange={(value) => setFormData(prev => ({ ...prev, scenarioIds: value }))}
                        multiple
                        placeholder="Select scenarios..."
                    />
                </div>

                <div className="form-group">
                    <label>Evolution</label>
                    <EntitySelector
                        value={formData.evoIds}
                        onChange={(value) => setFormData(prev => ({ ...prev, evoIds: value }))}
                        multiple
                        entityType="definition"
                        placeholder="Select evolved definitions..."
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
                    </button>
                    <button type="button" onClick={() => navigate('/definitions')} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}

export default DefinitionForm

