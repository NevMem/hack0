import React, { Component } from 'react'

export default class Modal extends Component {
    constructor(prps) {
        super(prps)
    }

    render() {
        if (!this.props.visible)
            return null
        return (
            <div className = 'blur'>
                <div className = 'modalWrapper'>
                    <div className = 'modalHeader'>
                        {this.props.renderHeader()}
                    </div>
                    <div className = 'modalContent'>
                        {this.props.renderContent()}
                    </div>
                </div>
            </div>
        )
    }
}