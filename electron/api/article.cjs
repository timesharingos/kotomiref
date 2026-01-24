const { ipcMain } = require("electron")
const { invokeDb } = require("../config/default.cjs")
const kg_interface = require("../kg/interface.cjs")
const articleType = require("../kg/reftype/article.cjs")
const signatureType = require("../kg/reftype/signature.cjs")

/**
 * Register article management IPC handlers
 */
function registerArticleHandlers() {
    // Get all articles
    ipcMain.handle("article:getAll", async () => {
        try {
            return invokeDb((db) => {
                const articleTypeInstance = articleType.Article.instance
                const nodes = db.nodeops.queryNodesByType(articleTypeInstance.id)

                return nodes.map(node => {
                    // Get article attributes
                    const titleAttr = node.attributes[0] ? db.attrops.queryAttrById(node.attributes[0]) : null
                    const primaryRefAttr = node.attributes[1] ? db.attrops.queryAttrById(node.attributes[1]) : null
                    const pathAttr = node.attributes[2] ? db.attrops.queryAttrById(node.attributes[2]) : null

                    // Get references
                    const refEntryType = articleType.ArticleRefEntry.instance
                    const refRels = db.relops.queryRelsByFromId(refEntryType.id, node.id)
                    const references = refRels.map(rel => {
                        const refNode = db.nodeops.queryNodeById(rel.to)
                        if (!refNode) return null
                        
                        // Get reference attributes
                        const refAttrs = refNode.attributes.map(attrId => db.attrops.queryAttrById(attrId))
                        
                        // Get signatures for this reference
                        const sigType = articleType.RefSignature.instance
                        const sigRels = db.relops.queryRelsByFromId(sigType.id, refNode.id)
                        const signatures = sigRels.map((sigRel, index) => {
                            const sigNode = db.nodeops.queryNodeById(sigRel.to)
                            if (!sigNode) return null

                            // Get author and affiliation from relations
                            const sigAuthorRelType = signatureType.SignatureAuthor.instance
                            const sigAffiliationRelType = signatureType.SignatureAffiliation.instance

                            const authorRels = db.relops.queryRelsByFromId(sigAuthorRelType.id, sigNode.id)
                            const affiliationRels = db.relops.queryRelsByFromId(sigAffiliationRelType.id, sigNode.id)

                            return {
                                id: sigNode.id,
                                authorId: authorRels.length > 0 ? authorRels[0].to : '',
                                affiliationId: affiliationRels.length > 0 ? affiliationRels[0].to : '',
                                order: index
                            }
                        }).filter(sig => sig !== null)

                        return {
                            id: refNode.id,
                            refNo: refAttrs[0]?.value || 0,
                            refIndex: refAttrs[1]?.value || '',
                            refTitle: refAttrs[2]?.value || '',
                            refPublication: refAttrs[3]?.value || '',
                            refYear: (refAttrs[4]?.value !== undefined && refAttrs[4]?.value >= 0) ? refAttrs[4]?.value : null,
                            refVolume: (refAttrs[5]?.value !== undefined && refAttrs[5]?.value >= 0) ? refAttrs[5]?.value : null,
                            refIssue: (refAttrs[6]?.value !== undefined && refAttrs[6]?.value >= 0) ? refAttrs[6]?.value : null,
                            refStartPage: (refAttrs[7]?.value !== undefined && refAttrs[7]?.value >= 0) ? refAttrs[7]?.value : null,
                            refEndPage: (refAttrs[8]?.value !== undefined && refAttrs[8]?.value >= 0) ? refAttrs[8]?.value : null,
                            refDoi: refAttrs[9]?.value || '',
                            refAbs: refAttrs[10]?.value || '',
                            signatures: signatures
                        }
                    }).filter(ref => ref !== null)

                    // Get entity tags
                    const tagType = articleType.ArticleTag.instance
                    const tagRels = db.relops.queryRelsByFromId(tagType.id, node.id)
                    const entityTags = tagRels.map(rel => rel.to)

                    // Get contributions
                    const contribType = articleType.ArticleContrib.instance
                    const contribRels = db.relops.queryRelsByFromId(contribType.id, node.id)
                    const contributions = contribRels.map(rel => rel.to)

                    return {
                        id: node.id,
                        artTitle: titleAttr?.value || '',
                        artPrimaryRefEntry: primaryRefAttr?.value || null,
                        artPath: pathAttr?.value || '',
                        references: references,
                        entityTags: entityTags,
                        contributions: contributions
                    }
                })
            })
        } catch (e) {
            console.error("Failed to get articles:", e)
            return []
        }
    })

    // Get article by ID
    ipcMain.handle("article:getById", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                const node = db.nodeops.queryNodeById(id)
                if (!node) return null

                // Get article attributes
                const titleAttr = node.attributes[0] ? db.attrops.queryAttrById(node.attributes[0]) : null
                const primaryRefAttr = node.attributes[1] ? db.attrops.queryAttrById(node.attributes[1]) : null
                const pathAttr = node.attributes[2] ? db.attrops.queryAttrById(node.attributes[2]) : null

                // Get references (same as getAll)
                const refEntryType = articleType.ArticleRefEntry.instance
                const refRels = db.relops.queryRelsByFromId(refEntryType.id, node.id)
                const references = refRels.map(rel => {
                    const refNode = db.nodeops.queryNodeById(rel.to)
                    if (!refNode) return null
                    
                    const refAttrs = refNode.attributes.map(attrId => db.attrops.queryAttrById(attrId))
                    
                    const sigType = articleType.RefSignature.instance
                    const sigRels = db.relops.queryRelsByFromId(sigType.id, refNode.id)
                    const signatures = sigRels.map((sigRel, index) => {
                        const sigNode = db.nodeops.queryNodeById(sigRel.to)
                        if (!sigNode) return null

                        // Get author and affiliation from relations
                        const sigAuthorRelType = signatureType.SignatureAuthor.instance
                        const sigAffiliationRelType = signatureType.SignatureAffiliation.instance

                        const authorRels = db.relops.queryRelsByFromId(sigAuthorRelType.id, sigNode.id)
                        const affiliationRels = db.relops.queryRelsByFromId(sigAffiliationRelType.id, sigNode.id)

                        return {
                            id: sigNode.id,
                            authorId: authorRels.length > 0 ? authorRels[0].to : '',
                            affiliationId: affiliationRels.length > 0 ? affiliationRels[0].to : '',
                            order: index
                        }
                    }).filter(sig => sig !== null)

                    return {
                        id: refNode.id,
                        refNo: refAttrs[0]?.value || 0,
                        refIndex: refAttrs[1]?.value || '',
                        refTitle: refAttrs[2]?.value || '',
                        refPublication: refAttrs[3]?.value || '',
                        refYear: refAttrs[4]?.value || null,
                        refVolume: refAttrs[5]?.value || null,
                        refIssue: refAttrs[6]?.value || null,
                        refStartPage: refAttrs[7]?.value || null,
                        refEndPage: refAttrs[8]?.value || null,
                        refDoi: refAttrs[9]?.value || '',
                        refAbs: refAttrs[10]?.value || '',
                        signatures: signatures
                    }
                }).filter(ref => ref !== null)

                // Get entity tags
                const tagType = articleType.ArticleTag.instance
                const tagRels = db.relops.queryRelsByFromId(tagType.id, node.id)
                const entityTags = tagRels.map(rel => rel.to)

                // Get contributions
                const contribType = articleType.ArticleContrib.instance
                const contribRels = db.relops.queryRelsByFromId(contribType.id, node.id)
                const contributions = contribRels.map(rel => rel.to)

                return {
                    id: node.id,
                    artTitle: titleAttr?.value || '',
                    artPrimaryRefEntry: primaryRefAttr?.value || null,
                    artPath: pathAttr?.value || '',
                    references: references,
                    entityTags: entityTags,
                    contributions: contributions
                }
            })
        } catch (e) {
            console.error("Failed to get article by ID:", e)
            return null
        }
    })

    // Add article
    ipcMain.handle("article:add", async (_ev, data) => {
        try {
            const { artTitle, artPath, artPrimaryRefEntry, references, entityTags, contributions } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const articleTypeInstance = articleType.Article.instance

                    // Create attribute instances for article
                    const titleAttr = new kg_interface.AttributeInstance(
                        articleType.AttributeArtTitle.instance.id,
                        artTitle || ""
                    )
                    const primaryRefAttr = new kg_interface.AttributeInstance(
                        articleType.AttributeArtPrimaryRefEntry.instance.id,
                        artPrimaryRefEntry !== null && artPrimaryRefEntry !== undefined ? artPrimaryRefEntry : -1
                    )
                    const pathAttr = new kg_interface.AttributeInstance(
                        articleType.AttributeArtPath.instance.id,
                        artPath || ""
                    )

                    // Store attributes
                    db.attrops.mergeAttr(titleAttr.toDb())
                    db.attrops.mergeAttr(primaryRefAttr.toDb())
                    db.attrops.mergeAttr(pathAttr.toDb())

                    // Create article node
                    const articleNode = new kg_interface.Node(
                        articleTypeInstance.id,
                        [titleAttr.id, primaryRefAttr.id, pathAttr.id],
                        artTitle
                    )
                    db.nodeops.mergeNode(articleNode.toDb())

                    // Create references
                    if (references && references.length > 0) {
                        const referenceType = articleType.Reference.instance
                        const refEntryType = articleType.ArticleRefEntry.instance
                        const sigType = articleType.RefSignature.instance
                        const signatureTypeInstance = signatureType.Signature.instance
                        const sigAuthorRelType = signatureType.SignatureAuthor.instance
                        const sigAffiliationRelType = signatureType.SignatureAffiliation.instance

                        for (const ref of references) {
                            // Create reference attributes
                            const refNoAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefNo.instance.id,
                                ref.refNo !== null && ref.refNo !== undefined ? ref.refNo : 0
                            )
                            const refIndexAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefIndex.instance.id,
                                ref.refIndex || ""
                            )
                            const refTitleAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefTitle.instance.id,
                                ref.refTitle || ""
                            )
                            const refPublicationAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefPublication.instance.id,
                                ref.refPublication || ""
                            )
                            const refYearAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefYear.instance.id,
                                ref.refYear !== null && ref.refYear !== undefined ? ref.refYear : -1
                            )
                            const refVolumeAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefVolume.instance.id,
                                ref.refVolume !== null && ref.refVolume !== undefined ? ref.refVolume : -1
                            )
                            const refIssueAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefIssue.instance.id,
                                ref.refIssue !== null && ref.refIssue !== undefined ? ref.refIssue : -1
                            )
                            const refStartPageAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefStartPage.instance.id,
                                ref.refStartPage !== null && ref.refStartPage !== undefined ? ref.refStartPage : -1
                            )
                            const refEndPageAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefEndPage.instance.id,
                                ref.refEndPage !== null && ref.refEndPage !== undefined ? ref.refEndPage : -1
                            )
                            const refDoiAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefDoi.instance.id,
                                ref.refDoi || ""
                            )
                            const refAbsAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefAbstract.instance.id,
                                ref.refAbs || ""
                            )

                            // Store reference attributes
                            db.attrops.mergeAttr(refNoAttr.toDb())
                            db.attrops.mergeAttr(refIndexAttr.toDb())
                            db.attrops.mergeAttr(refTitleAttr.toDb())
                            db.attrops.mergeAttr(refPublicationAttr.toDb())
                            db.attrops.mergeAttr(refYearAttr.toDb())
                            db.attrops.mergeAttr(refVolumeAttr.toDb())
                            db.attrops.mergeAttr(refIssueAttr.toDb())
                            db.attrops.mergeAttr(refStartPageAttr.toDb())
                            db.attrops.mergeAttr(refEndPageAttr.toDb())
                            db.attrops.mergeAttr(refDoiAttr.toDb())
                            db.attrops.mergeAttr(refAbsAttr.toDb())

                            // Create reference node
                            const refNode = new kg_interface.Node(
                                referenceType.id,
                                [
                                    refNoAttr.id, refIndexAttr.id, refTitleAttr.id,
                                    refPublicationAttr.id, refYearAttr.id, refVolumeAttr.id, refIssueAttr.id,
                                    refStartPageAttr.id, refEndPageAttr.id, refDoiAttr.id, refAbsAttr.id
                                ],
                                `${artTitle}_ref_${ref.refNo}`
                            )
                            db.nodeops.mergeNode(refNode.toDb())

                            // Create article-reference relation
                            const articleRefRel = new kg_interface.Rel(
                                refEntryType.id,
                                `${articleNode.id}_refEntry_${refNode.id}`,
                                [],
                                articleNode.id,
                                refNode.id
                            )
                            db.relops.mergeRel(articleRefRel.toDb())

                            // Create signatures for this reference
                            if (ref.signatures && ref.signatures.length > 0) {
                                for (const sig of ref.signatures) {
                                    // Create signature name attribute (using order as name)
                                    const sigNameAttr = new kg_interface.AttributeInstance(
                                        signatureType.AttributeSigName.instance.id,
                                        `${refNode.id}_sig_${sig.order}`
                                    )

                                    // Store signature attribute
                                    db.attrops.mergeAttr(sigNameAttr.toDb())

                                    // Create signature node
                                    const sigNode = new kg_interface.Node(
                                        signatureTypeInstance.id,
                                        [sigNameAttr.id],
                                        `${refNode.id}_sig_${sig.order}`
                                    )
                                    db.nodeops.mergeNode(sigNode.toDb())

                                    // Create reference-signature relation
                                    const refSigRel = new kg_interface.Rel(
                                        sigType.id,
                                        `${refNode.id}_signature_${sigNode.id}`,
                                        [],
                                        refNode.id,
                                        sigNode.id
                                    )
                                    db.relops.mergeRel(refSigRel.toDb())

                                    // Create signature-author relation
                                    if (sig.authorId) {
                                        const sigAuthorRel = new kg_interface.Rel(
                                            sigAuthorRelType.id,
                                            `${sigNode.id}_author_${sig.authorId}`,
                                            [],
                                            sigNode.id,
                                            sig.authorId
                                        )
                                        db.relops.mergeRel(sigAuthorRel.toDb())
                                    }

                                    // Create signature-affiliation relation
                                    if (sig.affiliationId) {
                                        const sigAffiliationRel = new kg_interface.Rel(
                                            sigAffiliationRelType.id,
                                            `${sigNode.id}_affiliation_${sig.affiliationId}`,
                                            [],
                                            sigNode.id,
                                            sig.affiliationId
                                        )
                                        db.relops.mergeRel(sigAffiliationRel.toDb())
                                    }
                                }
                            }
                        }
                    }

                    // Create article-entity tag relations
                    if (entityTags && entityTags.length > 0) {
                        const tagType = articleType.ArticleTag.instance
                        for (const entityId of entityTags) {
                            const tagRel = new kg_interface.Rel(
                                tagType.id,
                                `${articleNode.id}_tag_${entityId}`,
                                [],
                                articleNode.id,
                                entityId
                            )
                            db.relops.mergeRel(tagRel.toDb())
                        }
                    }

                    // Create article-contribution relations
                    if (contributions && contributions.length > 0) {
                        const contribType = articleType.ArticleContrib.instance
                        for (const contribId of contributions) {
                            const contribRel = new kg_interface.Rel(
                                contribType.id,
                                `${articleNode.id}_contrib_${contribId}`,
                                [],
                                articleNode.id,
                                contribId
                            )
                            db.relops.mergeRel(contribRel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true, id: articleNode.id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to add article:", e)
            return { success: false, error: e.message }
        }
    })

    // Update article
    ipcMain.handle("article:update", async (_ev, data) => {
        try {
            const { id, artTitle, artPath, artPrimaryRefEntry, references, entityTags, contributions } = data
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    const existingNode = db.nodeops.queryNodeById(id)
                    if (!existingNode) {
                        throw new Error("Article not found")
                    }

                    // Delete old attributes
                    for (const attrId of existingNode.attributes) {
                        db.attrops.deleteAttr(attrId)
                    }

                    // Create new attribute instances
                    const titleAttr = new kg_interface.AttributeInstance(
                        articleType.AttributeArtTitle.instance.id,
                        artTitle || ""
                    )
                    const primaryRefAttr = new kg_interface.AttributeInstance(
                        articleType.AttributeArtPrimaryRefEntry.instance.id,
                        artPrimaryRefEntry !== null && artPrimaryRefEntry !== undefined ? artPrimaryRefEntry : -1
                    )
                    const pathAttr = new kg_interface.AttributeInstance(
                        articleType.AttributeArtPath.instance.id,
                        artPath || ""
                    )

                    // Store new attributes
                    db.attrops.mergeAttr(titleAttr.toDb())
                    db.attrops.mergeAttr(primaryRefAttr.toDb())
                    db.attrops.mergeAttr(pathAttr.toDb())

                    // Update article node
                    const updatedNode = new kg_interface.Node(
                        existingNode.type,
                        [titleAttr.id, primaryRefAttr.id, pathAttr.id],
                        artTitle
                    )
                    updatedNode.id = id
                    db.nodeops.mergeNode(updatedNode.toDb())

                    // Delete old references and their relations
                    const refEntryType = articleType.ArticleRefEntry.instance
                    const oldRefRels = db.relops.queryRelsByFromId(refEntryType.id, id)
                    for (const rel of oldRefRels) {
                        // Delete signatures for this reference
                        const sigType = articleType.RefSignature.instance
                        const sigRels = db.relops.queryRelsByFromId(sigType.id, rel.to)
                        for (const sigRel of sigRels) {
                            const sigNode = db.nodeops.queryNodeById(sigRel.to)
                            if (sigNode) {
                                for (const attrId of sigNode.attributes) {
                                    db.attrops.deleteAttr(attrId)
                                }
                                db.nodeops.deleteNode(sigRel.to)
                            }
                            db.relops.deleteRel(sigRel.id)
                        }

                        // Delete reference node
                        const refNode = db.nodeops.queryNodeById(rel.to)
                        if (refNode) {
                            for (const attrId of refNode.attributes) {
                                db.attrops.deleteAttr(attrId)
                            }
                            db.nodeops.deleteNode(rel.to)
                        }
                        db.relops.deleteRel(rel.id)
                    }

                    // Create new references (same logic as add)
                    if (references && references.length > 0) {
                        const referenceType = articleType.Reference.instance
                        const refEntryType = articleType.ArticleRefEntry.instance
                        const sigType = articleType.RefSignature.instance
                        const signatureTypeInstance = signatureType.Signature.instance
                        const sigAuthorRelType = signatureType.SignatureAuthor.instance
                        const sigAffiliationRelType = signatureType.SignatureAffiliation.instance

                        for (const ref of references) {
                            // Create reference attributes
                            const refNoAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefNo.instance.id,
                                ref.refNo !== null && ref.refNo !== undefined ? ref.refNo : 0
                            )
                            const refIndexAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefIndex.instance.id,
                                ref.refIndex || ""
                            )
                            const refTitleAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefTitle.instance.id,
                                ref.refTitle || ""
                            )
                            const refPublicationAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefPublication.instance.id,
                                ref.refPublication || ""
                            )
                            const refYearAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefYear.instance.id,
                                ref.refYear !== null && ref.refYear !== undefined ? ref.refYear : -1
                            )
                            const refVolumeAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefVolume.instance.id,
                                ref.refVolume !== null && ref.refVolume !== undefined ? ref.refVolume : -1
                            )
                            const refIssueAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefIssue.instance.id,
                                ref.refIssue !== null && ref.refIssue !== undefined ? ref.refIssue : -1
                            )
                            const refStartPageAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefStartPage.instance.id,
                                ref.refStartPage !== null && ref.refStartPage !== undefined ? ref.refStartPage : -1
                            )
                            const refEndPageAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefEndPage.instance.id,
                                ref.refEndPage !== null && ref.refEndPage !== undefined ? ref.refEndPage : -1
                            )
                            const refDoiAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefDoi.instance.id,
                                ref.refDoi || ""
                            )
                            const refAbsAttr = new kg_interface.AttributeInstance(
                                articleType.AttributeRefAbstract.instance.id,
                                ref.refAbs || ""
                            )

                            // Store reference attributes
                            db.attrops.mergeAttr(refNoAttr.toDb())
                            db.attrops.mergeAttr(refIndexAttr.toDb())
                            db.attrops.mergeAttr(refTitleAttr.toDb())
                            db.attrops.mergeAttr(refPublicationAttr.toDb())
                            db.attrops.mergeAttr(refYearAttr.toDb())
                            db.attrops.mergeAttr(refVolumeAttr.toDb())
                            db.attrops.mergeAttr(refIssueAttr.toDb())
                            db.attrops.mergeAttr(refStartPageAttr.toDb())
                            db.attrops.mergeAttr(refEndPageAttr.toDb())
                            db.attrops.mergeAttr(refDoiAttr.toDb())
                            db.attrops.mergeAttr(refAbsAttr.toDb())

                            // Create reference node
                            const refNode = new kg_interface.Node(
                                referenceType.id,
                                [
                                    refNoAttr.id, refIndexAttr.id, refTitleAttr.id,
                                    refPublicationAttr.id, refYearAttr.id, refVolumeAttr.id, refIssueAttr.id,
                                    refStartPageAttr.id, refEndPageAttr.id, refDoiAttr.id, refAbsAttr.id
                                ],
                                `${artTitle}_ref_${ref.refNo}`
                            )
                            db.nodeops.mergeNode(refNode.toDb())

                            // Create article-reference relation
                            const articleRefRel = new kg_interface.Rel(
                                refEntryType.id,
                                `${id}_refEntry_${refNode.id}`,
                                [],
                                id,
                                refNode.id
                            )
                            db.relops.mergeRel(articleRefRel.toDb())

                            // Create signatures for this reference
                            if (ref.signatures && ref.signatures.length > 0) {
                                for (const sig of ref.signatures) {
                                    // Create signature name attribute (using order as name)
                                    const sigNameAttr = new kg_interface.AttributeInstance(
                                        signatureType.AttributeSigName.instance.id,
                                        `${refNode.id}_sig_${sig.order}`
                                    )

                                    // Store signature attribute
                                    db.attrops.mergeAttr(sigNameAttr.toDb())

                                    // Create signature node
                                    const sigNode = new kg_interface.Node(
                                        signatureTypeInstance.id,
                                        [sigNameAttr.id],
                                        `${refNode.id}_sig_${sig.order}`
                                    )
                                    db.nodeops.mergeNode(sigNode.toDb())

                                    // Create reference-signature relation
                                    const refSigRel = new kg_interface.Rel(
                                        sigType.id,
                                        `${refNode.id}_signature_${sigNode.id}`,
                                        [],
                                        refNode.id,
                                        sigNode.id
                                    )
                                    db.relops.mergeRel(refSigRel.toDb())

                                    // Create signature-author relation
                                    if (sig.authorId) {
                                        const sigAuthorRel = new kg_interface.Rel(
                                            sigAuthorRelType.id,
                                            `${sigNode.id}_author_${sig.authorId}`,
                                            [],
                                            sigNode.id,
                                            sig.authorId
                                        )
                                        db.relops.mergeRel(sigAuthorRel.toDb())
                                    }

                                    // Create signature-affiliation relation
                                    if (sig.affiliationId) {
                                        const sigAffiliationRel = new kg_interface.Rel(
                                            sigAffiliationRelType.id,
                                            `${sigNode.id}_affiliation_${sig.affiliationId}`,
                                            [],
                                            sigNode.id,
                                            sig.affiliationId
                                        )
                                        db.relops.mergeRel(sigAffiliationRel.toDb())
                                    }
                                }
                            }
                        }
                    }

                    // Delete old entity tag relations
                    const tagType = articleType.ArticleTag.instance
                    db.relops.deleteRelsByFromId(tagType.id, id)

                    // Create new entity tag relations
                    if (entityTags && entityTags.length > 0) {
                        for (const entityId of entityTags) {
                            const tagRel = new kg_interface.Rel(
                                tagType.id,
                                `${id}_tag_${entityId}`,
                                [],
                                id,
                                entityId
                            )
                            db.relops.mergeRel(tagRel.toDb())
                        }
                    }

                    // Delete old contribution relations
                    const contribType = articleType.ArticleContrib.instance
                    db.relops.deleteRelsByFromId(contribType.id, id)

                    // Create new contribution relations
                    if (contributions && contributions.length > 0) {
                        for (const contribId of contributions) {
                            const contribRel = new kg_interface.Rel(
                                contribType.id,
                                `${id}_contrib_${contribId}`,
                                [],
                                id,
                                contribId
                            )
                            db.relops.mergeRel(contribRel.toDb())
                        }
                    }

                    db.dbops.commit()
                    return { success: true, id: id }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to update article:", e)
            return { success: false, error: e.message }
        }
    })

    // Delete article
    ipcMain.handle("article:delete", async (_ev, id) => {
        try {
            return invokeDb((db) => {
                db.dbops.begin()
                try {
                    // Delete all references and their signatures
                    const refEntryType = articleType.ArticleRefEntry.instance
                    const refRels = db.relops.queryRelsByFromId(refEntryType.id, id)
                    for (const rel of refRels) {
                        // Delete signatures for this reference
                        const sigType = articleType.RefSignature.instance
                        const sigRels = db.relops.queryRelsByFromId(sigType.id, rel.to)
                        for (const sigRel of sigRels) {
                            const sigNode = db.nodeops.queryNodeById(sigRel.to)
                            if (sigNode) {
                                for (const attrId of sigNode.attributes) {
                                    db.attrops.deleteAttr(attrId)
                                }
                                db.nodeops.deleteNode(sigRel.to)
                            }
                            db.relops.deleteRel(sigRel.id)
                        }

                        // Delete reference node
                        const refNode = db.nodeops.queryNodeById(rel.to)
                        if (refNode) {
                            for (const attrId of refNode.attributes) {
                                db.attrops.deleteAttr(attrId)
                            }
                            db.nodeops.deleteNode(rel.to)
                        }
                        db.relops.deleteRel(rel.id)
                    }

                    // Delete entity tag relations
                    const tagType = articleType.ArticleTag.instance
                    db.relops.deleteRelsByFromId(tagType.id, id)

                    // Delete contribution relations
                    const contribType = articleType.ArticleContrib.instance
                    db.relops.deleteRelsByFromId(contribType.id, id)

                    // Delete article node and its attributes
                    const node = db.nodeops.queryNodeById(id)
                    if (node) {
                        for (const attrId of node.attributes) {
                            db.attrops.deleteAttr(attrId)
                        }
                    }
                    db.nodeops.deleteNode(id)

                    db.dbops.commit()
                    return { success: true }
                } catch (e) {
                    db.dbops.rollback()
                    throw e
                }
            })
        } catch (e) {
            console.error("Failed to delete article:", e)
            return { success: false, error: e.message }
        }
    })
}

module.exports = {
    registerArticleHandlers
}

