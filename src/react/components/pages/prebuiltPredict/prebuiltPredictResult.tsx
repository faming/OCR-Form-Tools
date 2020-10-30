// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {PrimaryButton} from "@fluentui/react";
import React from "react";
import {getPrimaryGreenTheme} from "../../../../common/themes";
import {ITag} from "../../../../models/applicationState";
import "./prebuiltPredictResult.scss";
import _ from "lodash";
import {downloadAsJsonFile} from "../../../../common/utils";


export interface IPrebuiltPredictResultProps {
    predictions: {[key: string]: any};
    analyzeResult: object;
    page: number;
    tags?: ITag[];
    downloadResultLabel: string;
    resultType: string;
    onPredictionClick?: (item: any) => void;
    onPredictionMouseEnter?: (item: any) => void;
    onPredictionMouseLeave?: (item: any) => void;
}

export default class PrebuiltPredictResult extends React.Component<IPrebuiltPredictResultProps> {
    public render() {
        const {tags, predictions} = this.props;
        const tagsDisplayOrder = tags.map((tag) => tag.name);
        for (const name of Object.keys(predictions)) {
            const prediction = predictions[name];
            if (prediction != null) {
                prediction.fieldName = name;
                prediction.displayOrder = tagsDisplayOrder.indexOf(name);
            }
        }
        // not sure if we decide to filter item by the page
        const items = Object.values(predictions).filter(Boolean).sort((p1, p2) => p1.displayOrder - p2.displayOrder);

        return (
            <div>
                <div className="container-items-center container-space-between results-container">
                    <h5 className="results-header">Prediction results</h5>
                    <PrimaryButton
                        className="align-self-end keep-button-80px"
                        theme={getPrimaryGreenTheme()}
                        text="Download"
                        allowDisabledFocus
                        autoFocus={true}
                        onClick={this.onDownloadClick}
                    />
                </div>
                <div className="prediction-field-header">
                    <h6 className="prediction-field-header-field"> Page # / Field name / Value</h6>
                    <h6 className="prediction-field-header-confidence"> Confidence</h6>
                </div>
                <div className="prediction-header-clear"></div>

                {items.map((item: any, key) => this.renderItem(item, key))}
            </div>
        );
    }

    private renderItem = (item: any, key: any) => {
        const postProcessedValue = getPostProcessedValue(item);
        const style: any = {
            marginLeft: "0px",
            marginRight: "0px",
            background: this.getTagColor(item.fieldName),
        };
        return (
            <div key={key}
                onClick={() => this.onPredictionClick(item)}
                onMouseEnter={() => this.onPredictionMouseEnter(item)}
                onMouseLeave={() => this.onPredictionMouseLeave(item)}>
                <li className="predictiontag-item" style={style}>
                    <div className={"predictiontag-color"}>
                        <span>{item.page}</span>
                    </div>
                    <div className={"predictiontag-content"}>
                        {this.getPredictionTagContent(item)}
                    </div>
                </li>
                <li className={postProcessedValue ? "predictiontag-item-label mt-0" : "predictiontag-item-label mt-0 mb-1"}>
                    {postProcessedValue ? "text: " + item.text : item.text}
                </li>
                {postProcessedValue &&
                    <li className="predictiontag-item-label mb-1">
                        {postProcessedValue}
                    </li>
                }
            </div>
        );
    }

    private getTagColor = (name: string): string => {
        const tag: ITag = this.props.tags.find((tag) => tag.name.toLocaleLowerCase() === name.toLocaleLowerCase());
        if (tag) {
            return tag.color;
        }
        return "#999999";
    }

    private getPredictionTagContent = (item: any) => {
        return (
            <div className={"predictiontag-name-container"}>
                <div className="predictiontag-name-body">
                    {
                        <span title={item.fieldName} className="predictiontag-name-text px-2">
                            {item.fieldName}
                        </span>
                    }
                </div>
                <div className={"predictiontag-confidence"}>
                    <span>{(item.confidence * 100).toFixed(2) + "%"}</span>
                </div>
            </div>
        );
    }

    private onDownloadClick = (): void => {
        const {analyzeResult} = this.props;
        const predictionData = JSON.stringify(sanitizeData(analyzeResult));
        downloadAsJsonFile(predictionData, this.props.downloadResultLabel, `${this.props.resultType}-`);
    }

    private onPredictionClick = (prediction: any) => {
        if (this.props.onPredictionClick) {
            this.props.onPredictionClick(prediction);
        }
    }

    private onPredictionMouseEnter = (prediction: any) => {
        if (this.props.onPredictionMouseEnter) {
            this.props.onPredictionMouseEnter(prediction);
        }
    }

    private onPredictionMouseLeave = (prediction: any) => {
        if (this.props.onPredictionMouseLeave) {
            this.props.onPredictionMouseLeave(prediction);
        }
    }
}

// Helper: Sanitizes the results of prediction in order to align it with API from the service
const sanitizeData = (data: any): void => {
    const fields = _.get(data, "analyzeResult.documentResults[0].fields", {});
    for (const key in fields) {
        if (fields[key] !== null) {
            if (fields[key].hasOwnProperty("displayOrder")) {
                delete fields[key].displayOrder;
            }
            if (fields[key].hasOwnProperty("fieldName")) {
                delete fields[key].fieldName;
            }
        }
    }
    return data;
}

const getPostProcessedValue = (prediction: any) => {
    if (!prediction.type || !prediction.text) {
        return null;
    }
    const predictionType = prediction.type;
    const predictionText = prediction.text;
    let postProcessedValue;
    let valueType;
    switch (predictionType) {
        case "string":
            valueType = "valueString";
            postProcessedValue = prediction.valueString;
            break;
        case "date":
            valueType = "valueDate";
            postProcessedValue = prediction.valueDate;
            break;
        case "number":
            valueType = "valueNumber";
            postProcessedValue = prediction.valueNumber?.toString();
            break;
        case "integer":
            valueType = "valueInteger";
            postProcessedValue = prediction.valueInteger?.toString();
            break;
        case "time":
            valueType = "valueTime";
            postProcessedValue = prediction.valueTime;
            break;
        default:
            return null;
    }
    if (typeof postProcessedValue === "string" && predictionText !== postProcessedValue) {
        return valueType + ": " + postProcessedValue;
    } else {
        return null;
    }
}